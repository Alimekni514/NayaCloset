import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createAbmPosition,
  getCities,
  getDeliveryAddressBook,
  getDeliveryAddressDetail,
  getGovernorates,
  getLocalities,
  getPickupAddressBook,
  getPickupAddressDetail,
  getPositionFormOptions,
  getPostalCode,
} from './abm-position.service';

export const getPositionFormOptionsController = async (_req: Request, res: Response) => {
  const options = await getPositionFormOptions();
  res.status(StatusCodes.OK).json({ options });
};

export const getPickupAddressBookController = async (_req: Request, res: Response) => {
  const addresses = await getPickupAddressBook();
  res.status(StatusCodes.OK).json({ addresses });
};

export const getDeliveryAddressBookController = async (_req: Request, res: Response) => {
  const addresses = await getDeliveryAddressBook();
  res.status(StatusCodes.OK).json({ addresses });
};

export const getGovernoratesController = async (_req: Request, res: Response) => {
  const governorates = await getGovernorates();
  res.status(StatusCodes.OK).json({ governorates });
};

export const getCitiesController = async (req: Request, res: Response) => {
  const governorateId = String(req.query.governorateId);
  const cities = await getCities(governorateId);
  res.status(StatusCodes.OK).json({ cities });
};

export const getLocalitiesController = async (req: Request, res: Response) => {
  const cityId = String(req.query.cityId);
  const localities = await getLocalities(cityId);
  res.status(StatusCodes.OK).json({ localities });
};

export const getPostalCodeController = async (req: Request, res: Response) => {
  const localityId = String(req.query.localityId);
  const postalCode = await getPostalCode(localityId);
  res.status(StatusCodes.OK).json(postalCode);
};

export const getPickupAddressDetailController = async (req: Request, res: Response) => {
  const address = await getPickupAddressDetail(String(req.params.id));
  res.status(StatusCodes.OK).json({ address });
};

export const getDeliveryAddressDetailController = async (req: Request, res: Response) => {
  const address = await getDeliveryAddressDetail(String(req.params.id));
  res.status(StatusCodes.OK).json({ address });
};

export const createAbmPositionController = async (req: Request, res: Response) => {
  const result = await createAbmPosition(req.body);
  res.status(StatusCodes.OK).json(result);
};
