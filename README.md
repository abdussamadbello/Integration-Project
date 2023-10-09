1. Creating the authorization URL

- Set up your app credentials
  CLIENT_ID=
  CLIENT_SECRET=
  CONFLUENCE_URL="https://api.atlassian.com/ex/confluence"
  CONFLUENCE_USER_EMAIL="user@gmail.com" etc
- Run Up Migration
- Check database after every step
- run/create seed file to create a user

2. Handling the oAuth callback

   - On your browser or CURL" http://localhost:8999/confluence/auth

3. Getting and saving to the database all of the users Confluence files

   1. It should be able to handle if the file already exists and needs updating

   - On your browser or CURL : http://localhost:8999/confluence/file

4. Getting and saving to the database all of the comments for all of their files from Confluence
   1. It should be able to handle if the comment already exists and needs updating
   2. It should be able to handle saving the author of the comment to the DB
   - On your browser or CURL : http://localhost:8999/confluence/file-comments
