import express from 'express';
import { GoogleService, ConfluenceService } from 'services';

const app = express();
const port = 8999;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/google/auth', (req, res) => {
  res.send(GoogleService.getAccessTokenUrl());
});

app.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  await GoogleService.authorize(code as string);
});

app.get('/confluence/auth', (req, res) => {
  res.redirect(ConfluenceService.getAuthorizationURL());
});

app.get('/confluence/callback', async (req, res) => {
  if (typeof req.query.code !== 'string') {
    return res.status(400).send('Invalid request parameter');
  }

  try {
    const tokenData = await ConfluenceService.getAccessToken(req.query.code);
    res.send(tokenData);
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});

app.get('/confluence/accessible-resources', async (req, res) => {
  try {
    const accessibleResources =
      await ConfluenceService.getAccessibleResources();
    res.send(accessibleResources);
  } catch (error) {
    res.status(500).send(`Authentication failed,${error}`);
  }
});

app.get('/confluence/user', async (req, res) => {
  try {
    const userData = await ConfluenceService.getCurrentUser();
    res.send(userData);
  } catch (error) {
    res.status(500).send(`Authentication failed,${error}`);
  }
});

app.get('/confluence/contents', async (req, res) => {
  try {
    const content = await ConfluenceService.getAllContent();
    res.send(content);
  } catch (error) {
    res.status(500).send(`Error occurred,${error}`);
  }
});

app.get('/confluence/files', async (req, res) => {
  try {
    const files = await ConfluenceService.getFiles();
    res.send(files);
  } catch (error) {
    res.status(500).send(`Error occurred,${error}`);
  }
});

app.get('/confluence/file-comments', async (req, res) => {
  try {
    console.log('object');
    const comments = await ConfluenceService.getFileComments();
    res.send(comments);
  } catch (error) {
    res.status(500).send(`Error occurred,${error}`);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
