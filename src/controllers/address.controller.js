import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../services/address.service.js";

import {
  createAddressSchema,
  updateAddressSchema,
} from "../validators/address.validator.js";

export const createAddressController = async (req, res, next) => {
  try {
    const validatedData = createAddressSchema.parse(req.body);

    const address = await createAddress(req.user.userId, validatedData);

    return res.status(201).json({
      success: true,
      data: address,
      message: "Address created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAddressesController = async (req, res, next) => {
  try {
    const addresses = await getAddresses(req.user.userId);

    return res.status(200).json({
      success: true,
      data: addresses,
      message: "Get addresses successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAddressByIdController = async (req, res, next) => {
  try {
    const address = await getAddressById(
      req.user.userId,
      Number(req.params.id),
    );

    return res.status(200).json({
      success: true,
      data: address,
      message: "Get address successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddressController = async (req, res, next) => {
  try {
    const validatedData = updateAddressSchema.parse(req.body);

    const address = await updateAddress(
      req.user.userId,
      Number(req.params.id),
      validatedData,
    );

    return res.status(200).json({
      success: true,
      data: address,
      message: "Address updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddressController = async (req, res, next) => {
  try {
    await deleteAddress(req.user.userId, Number(req.params.id));

    return res.status(200).json({
      success: true,
      data: null,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
