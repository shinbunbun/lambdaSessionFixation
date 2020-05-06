// モジュール呼び出し
const crypto = require('crypto');
const AWS = require('aws-sdk');
const dynamoDocument = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log(event);

  // cookie取得
  const cookie = event.headers.cookie;

  // cookieが存在しないか、cookieにsessionIdが含まれていない場合
  if (!cookie || cookie.indexOf('sessionId') === -1) {
    // セッションID生成
    const sessionId = crypto.randomBytes(256).toString('base64');

    // dynamoにput
    const params = {
      TableName: 'cookieTestUserTable',
      Item: {
        sessionId: sessionId
      }
    };
    await new Promise((resolve, reject) => {
      dynamoDocument.put(params, (err, data) => {
        if (err) {
          reject(err);
          const response = {
            statusCode: 500,
            body: ''
          };
          return response;
        } else {
          resolve(data);
        }
      });
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify('Login succeed'),
      headers: {
        'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Secure; max-age=86400;`
      }
    };
    return response;
  }

  // cookieからsessionIdを取り出す
  const cookieSplit = cookie.split('; ');
  let cookieSessionId;
  for (const property in cookieSplit) {
    if (cookieSplit.hasOwnProperty(property)) {
      if ((cookieSplit[property]).indexOf('sessionId') !== -1) {
        cookieSessionId = cookieSplit[property].slice(10);
      }
    }
  }

  console.log(cookieSessionId);

  // sessionIdをキーにしてDBを検索
  const params = {
    TableName: 'cookieTestUserTable',
    KeyConditionExpression: '#k = :val',
    ExpressionAttributeValues: {
      ':val': cookieSessionId
    },
    ExpressionAttributeNames: {
      '#k': 'sessionId'
    }
  };
  const promise = await new Promise((resolve, reject) => {
    dynamoDocument.query(params, (err, data) => {
      if (err) {
        reject(err);
        const response = {
          statusCode: 500,
          body: ''
        };
        return response;
      } else {
        resolve(data);
      }
    });
  });
  const value = promise.Items[0];

  // DBに値が存在した場合
  if (value) {
    const response = {
      statusCode: 200,
      body: JSON.stringify('Already logged in')
    };
    return response;
    // しなかった場合
  } else {
    const response = {
      statusCode: 500,
      body: JSON.stringify('Authorization error')
    };
    return response;
  }
};