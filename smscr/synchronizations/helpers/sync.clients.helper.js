const CustomError = require("../../../utils/custom-error");
const Customer = require("../../customer/customer.schema");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const fs = require("fs");
const path = require("path");

exports.createClientsHelper = async (clients, files, author, session) => {
  await Promise.all(
    clients.map(async data => {
      const file = files.find(e => data.imageId === e.fieldname);

      const newCustomer = await new Customer({
        name: data.name,
        address: data.address,
        city: data.city,
        telNo: data.telNo,
        mobileNo: data.mobileNo,
        bankAccountNo: data.bankAccountNo,
        zipCode: data.zipCode,
        birthdate: data.birthdate,
        birthplace: data.birthplace,
        spouse: data.spouse,
        memberStatus: data.memberStatus,
        civilStatus: data.civilStatus,
        center: data.center,
        dateRelease: data.dateRelease,
        business: data.business,
        position: data.position,
        age: data.age,
        acctNumber: data.acctNumber.toUpperCase(),
        acctOfficer: data.acctOfficer,
        sex: data.sex,
        dateResigned: data.dateResigned,
        reason: data.reason,
        parent: data.parent,
        beneficiaries: data.beneficiaries || [],
        children: data.children || [],
        image: {
          path: `uploads/clients/${file.filename}`,
          originalname: file.originalname,
          mimetype: file.mimetype,
          filename: file.filename,
          size: file.size,
        },
      }).save({ session });

      if (!newCustomer) {
        throw new CustomError("Failed to sync clients", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created a client`,
        resource: `clients`,
        dataId: newCustomer._id,
        session,
      });
    })
  );
};

exports.updateClientsHelper = async (clients, files, author, session) => {
  await Promise.all(
    clients.map(async data => {
      const file = files.find(e => data.imageId === e.fieldname);
      const filter = { _id: data._id };

      let oldImage = null;
      let updates = {
        $set: {
          name: data.name,
          address: data.address,
          city: data.city,
          telNo: data.telNo,
          mobileNo: data.mobileNo,
          bankAccountNo: data.bankAccountNo,
          zipCode: data.zipCode,
          birthdate: data.birthdate,
          birthplace: data.birthplace,
          spouse: data.spouse,
          memberStatus: data.memberStatus,
          civilStatus: data.civilStatus,
          center: data.center,
          dateRelease: data.dateRelease,
          business: data.business,
          position: data.position,
          age: data.age,
          acctNumber: data.acctNumber.toUpperCase(),
          acctOfficer: data.acctOfficer,
          sex: data.sex,
          dateResigned: data.dateResigned,
          reason: data.reason,
          parent: data.parent,
          beneficiaries: data.beneficiaries,
          children: data.children,
        },
      };

      if (file) {
        const client = await Customer.findOne(filter).session(session).lean().exec();
        if (client?.image) oldImage = client.image.path;
        updates.$set["image"] = {
          path: `uploads/clients/${file.filename}`,
          originalname: file.originalname,
          mimetype: file.mimetype,
          filename: file.filename,
          size: file.size,
        };
      }

      const updatedCustomer = await Customer.findOneAndUpdate(filter, updates, { new: true, session }).exec();
      if (!updatedCustomer) {
        throw new CustomError("Failed to sync clients", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a client`,
        resource: `clients`,
        dataId: updatedCustomer._id,
        session,
      });

      if (oldImage && fs.existsSync(path.resolve(global.rootDir, oldImage))) {
        await fs.promises.unlink(path.resolve(global.rootDir, oldImage));
      }
    })
  );
};

exports.deleteClientsHelper = async (clients, files, author, session) => {
  const ids = clients.map(e => e._id);
  const filter = { _id: { $in: ids }, deletedAt: null };

  const deleted = await Customer.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
  if (deleted.matchedCount !== clients.length) {
    throw new CustomError("Failed to sync the journal vouchers", 500);
  }

  const deletedClientsWithImage = await Customer.find({ _id: { $in: ids }, image: { $ne: null } })
    .lean()
    .exec();

  await Promise.all(
    deletedClientsWithImage.map(async client => {
      if (fs.existsSync(path.resolve(global.rootDir, client.image.path))) await fs.promises.unlink(path.resolve(global.rootDir, client.image.path));
    })
  );

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a client`,
    resource: `clients`,
    session,
  });
};
