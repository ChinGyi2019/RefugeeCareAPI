const sendResponse = (
  res,
  data,
  statusCode = 200,
  title,
  message,
  identifier
) => {
  console.log();
  const response = {
    data: data,
    statusCode: statusCode,
    title: title,
    message: message,
    identifier: identifier,
  };
  console.log(response);
  res.status(200).json(response);
};

module.exports = {
  sendResponse,
};
