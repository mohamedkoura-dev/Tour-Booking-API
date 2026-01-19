const catchAsync = require('./../utils/catchAsync');
const filterBody = require('./../utils/filterBody');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError(`Can not find a Document with ID:${req.params.id}`, 404),
      );
    }

    res.status(204).json({
      status: 'success',
      message: 'Document is deleted successfully',
    });
  });

exports.updateOne = (Model, filterFields) =>
  catchAsync(async (req, res, next) => {
    let filteredBody = filterFields
      ? filterBody(req.body, ...filterFields)
      : req.body;

    //What i did here is distinguishing between the update functionality between updating the tours and updating a user
    //So with the tour i use the req.body object to be the new data
    //But with the user i filter the body into specific fields for security measures like trying to update the password for example

    const doc = await Model.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(
        new AppError(`Can not find a document with ID:${req.params.id}`, 404),
      );

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, ...populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const doc = await query;

    if (!doc)
      return next(
        new AppError(`Can not find a tour with ID:${req.params.id}`, 404),
      );

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model, customQuery = undefined) =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET all reviews on specific tour
    let filter;
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const feature = new APIFeatures(
      Model.find(filter),
      req.customQuery || req.query,
    );

    feature.filter().limit().sort().paginate();

    const doc = await feature.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
