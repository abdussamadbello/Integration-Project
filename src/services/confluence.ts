import axios, { AxiosRequestConfig } from 'axios';
import { OAuthConfig } from 'config/oauth';
import crypto from 'crypto';
import prisma from 'loaders/prisma';

type CredentialsData = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: Date;
  scope?: string;
  token_type?: string;
};

const email = process.env.CONFLUENCE_USER_EMAIL;

const generateState = (length: number = 16): string => {
  return crypto.randomBytes(length).toString('hex');
};

const getDbToken = async () => {
  const { accessToken } = await getUserCredentials();
  return accessToken;
};

const getUserCredentials = async (): Promise<any> => {
  const data = await prisma.user.findUnique({
    where: {
      email: email,
    },
    include: {
      confluenceCredentials: true,
    },
  });
  return data?.confluenceCredentials;
};

const updateUserCredentials = async (data: CredentialsData) => {
  const credentialsToUpdate = {
    accessToken: data.access_token ?? null,
    refreshToken: data.refresh_token ?? null,
    expiryDate: data.expires_in,
    scope: data.scope,
    tokenType: data.token_type,
  };

  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.confluenceCredentials.upsert({
    where: { userId: user.id },
    update: { ...credentialsToUpdate },
    create: {
      user: {
        connect: {
          id: user.id,
        },
      },
      ...credentialsToUpdate,
    },
  });
};

const confluenceOAuthConfig: OAuthConfig = {
  authorizationURL: 'https://auth.atlassian.com/authorize',
  tokenURL: 'https://auth.atlassian.com/oauth/token',
  clientID: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  redirectURI: 'http://localhost:8999/confluence/callback',
};

export const getAuthorizationURL = (): string => {
  const { authorizationURL, clientID, redirectURI } = confluenceOAuthConfig;
  const state = generateState();
  const confluenceScopes = [
    'offline_access',
    'write:confluence-content',
    'read:confluence-space.summary',
    'write:confluence-space',
    'write:confluence-file',
    'read:confluence-props',
    'write:confluence-props',
    'manage:confluence-configuration',
    'read:confluence-content.all',
    'read:confluence-content.summary',
    'search:confluence',
    'read:confluence-content.permission',
    'read:confluence-user',
    'read:confluence-groups',
    'write:confluence-groups',
    'readonly:content.attachment:confluence',
    'read:content:confluence',
    'write:content:confluence',
    'read:content-details:confluence',
    'read:space-details:confluence',
    'read:page:confluence',
    'read:attachment:confluence',
    'read:custom-content:confluence',
    'read:comment:confluence',
    'read:watcher:confluence',
    'read:user:confluence',
    'read:space:confluence',
  ];

  const scopes = encodeURIComponent(confluenceScopes.join(' '));

  return `${authorizationURL}?audience=api.atlassian.com&client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&state=${state}&scope=${scopes}&prompt=consent`;
};

export const getAccessToken = async (code: string): Promise<any> => {
  const { tokenURL, clientID, clientSecret, redirectURI } =
    confluenceOAuthConfig;

  const response = await axios.post(tokenURL, null, {
    params: {
      client_id: clientID,
      client_secret: clientSecret,
      redirect_uri: redirectURI,
      code: code,
      grant_type: 'authorization_code',
    },
  });

  updateUserCredentials(response.data);

  return response.data;
};

export const refreshAccessToken = async (): Promise<any> => {
  const { tokenURL, clientID, clientSecret } = confluenceOAuthConfig;
  const { refreshToken } = await getUserCredentials();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const response = await axios.post(tokenURL, null, {
    params: {
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  });
  updateUserCredentials(response.data);
  return response.data;
};

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: process.env.CONFLUENCE_URL + '/714fd049-d7cc-4b07-9862-1f89fb4bfb22',
  // ideally this should be dynamic from the user accessible resources
  // https://api.atlassian.com/ex/confluence/{cloudid}/{api}  is the base URL for the API
  // id can be fetched from the accessible resources https://api.atlassian.com/oauth/token/accessible-resources
  headers: {
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getDbToken();
    const basicAuth = `Bearer ${token}`;

    if (token) {
      config.headers['Authorization'] = basicAuth;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const token = await getDbToken();
    const basicAuth = `Bearer ${token}`;
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(async () => {
            originalRequest.headers['Authorization'] = basicAuth;
            return await axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      originalRequest.headers['Authorization'] = null;

      try {
        const { accessToken } = await refreshAccessToken();
        originalRequest.headers['Authorization'] = basicAuth;
        processQueue(null, accessToken);
        return await axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export const getAccessibleResources = async (): Promise<any> => {
  const response = await axios.get(
    'https://api.atlassian.com/oauth/token/accessible-resources',
    {
      headers: {
        Authorization: `Bearer ${await getDbToken()}`,
      },
    },
  );
  return response.data;
};

export const getAllContent = async (): Promise<any> => {
  const response = await axiosInstance.get('/wiki/rest/api/content', {
    params: {
      cql: 'type=page or type=blogpost',
    },
  });
  return response.data.results;
};

export const getFiles = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/wiki/api/v2/attachments');
    console.log(response.data.results, 'response');
    const files = response.data.results.map((file: any) => {
      return {
        name: file.title,
        attachmentId: file.id,
        url: file._links.download,
        mediaType: file.mediaType,
        platform: 'confluence',
      };
    });

    const savedFiles = [];
    for (const file of files) {
      const existingFile = await prisma.confluenceFiles.findUnique({
        where: { attachmentId: file.attachmentId },
      });

      if (!existingFile) {
        const savedFile = await prisma.file.create({
          data: {
            name: file.name,
            platform: file.platform,
            confluenceFiles: {
              create: {
                attachmentId: file.attachmentId,
                url: file.url,
                mediaType: file.mediaType,
                title: file.name,
              },
            },
          },
        });
        savedFiles.push(savedFile);
      }
    }
    return savedFiles;
  } catch (error) {
    console.log(error, 'error');
  }
};

export const getFileComments = async (): Promise<any> => {
  const files = await prisma.confluenceFiles.findMany({});
  const comments = [];
  files.forEach(async (file) => {
    try {
      const response = await axiosInstance.get(
        `/wiki/api/v2/attachments/${file.attachmentId}/footer-comments`,
      );
      const commentData = response.data.results[0];
      let commentExist;
      if (commentData?.id) {
        commentExist = await prisma.comment.findFirst({
          where: {
            confluenceCommentId: commentData?.id,
          },
        });
      }
      if (!commentExist && commentData?.id && commentData?.version?.message) {
        console.log(commentData, 'object');
        const savedComment = await prisma.comment.create({
          data: {
            confluenceCommentId: commentData?.id,
            content: commentData?.version?.message,
            file: {
              connect: {
                id: file.fileId,
              },
            },
          },
        });
        comments.push(response.data.results);
      }
    } catch (error) {
      console.log(error, 'error');
    }
  });
  return comments;
};

export const getCurrentUser = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/wiki/rest/api/user/current');
    return response.data;
  } catch (error) {
    console.log(error, 'error');
  }
};
