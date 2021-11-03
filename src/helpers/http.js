module.exports.request = event => ({
  body: JSON.parse(event.body) || {},
  headers: event.headers || {},
  params: event.pathParameters || {},
  query: event.queryStringParameters || {}
});

module.exports.response = (data, status = 200) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(data)
});
