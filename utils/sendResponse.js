const sendResponse = (
  res,
  data,
  statusCode = 200,
  title,
  message,
  identifier
) => {
  res.status(200).json({
    data: data,
    statusCode: statusCode,
    title: title,
    message: message,
    identifier: identifier,
  });
};

module.exports = {
  sendResponse,
};
