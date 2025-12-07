exports.parseClientFormData = (req, res, next) => {
  const clients = [];

  let maxIndex = -1;

  Object.keys(req.body).forEach(key => {
    if (req.body[key].length - 1 > maxIndex) maxIndex = req.body[key].length - 1;
  });

  for (let i = 0; i <= maxIndex; i++) {
    let client = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key][i]) client[key] = req.body[key][i];
    });
    clients.push(client);
  }

  req.body.clients = clients;

  next();
};
