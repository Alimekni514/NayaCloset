import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../../lib/http-error';
import { getPickupAddressDetail, getPositionFormOptions } from '../abm/positions/abm-position.service';

const NAYA_STORE_PICKUP_ADDRESS = {
  contactLastName: 'Naya Store',
  addressLine1: 'El omrane',
  addressLine2: 'El omrane',
  governorateId: '23',
  governorateName: 'TUNIS',
  cityId: '73',
  cityName: 'EL OMRANE',
  localityId: '4705',
  localityName: 'EL OMRANE',
  postalCode: '1005',
  mobile: '20857773',
} as const;

export const loadNayaPickupConfiguration = async () => {
  const formOptions = await getPositionFormOptions();
  const pickupAddressId = formOptions.preferredPickupAddressId;

  if (!pickupAddressId) {
    throw new HttpError(StatusCodes.BAD_GATEWAY, 'Configuration ABM invalide.', {
      code: 'ABM_PICKUP_CONFIGURATION_INVALID',
    });
  }

  const pickupAddress = await getPickupAddressDetail(pickupAddressId);

  if (!pickupAddress.id) {
    throw new HttpError(StatusCodes.BAD_GATEWAY, 'Configuration ABM invalide.', {
      code: 'ABM_PICKUP_CONFIGURATION_INVALID',
    });
  }

  const onpService = formOptions.serviceOptions.find((option) => option.label.trim().toUpperCase() === 'ONP');
  const cashMode = formOptions.paymentModeOptions.find((option) =>
    option.label.trim().toUpperCase().includes('ESPEC'),
  );

  if (!onpService || !cashMode) {
    throw new HttpError(StatusCodes.BAD_GATEWAY, 'Configuration ABM invalide.', {
      code: 'ABM_SERVICE_CONFIGURATION_INVALID',
    });
  }

  const normalizedPickupAddress = {
    ...pickupAddress,
    ...NAYA_STORE_PICKUP_ADDRESS,
  };

  return {
    pickupAddress: normalizedPickupAddress,
    formOptions,
    serviceId: onpService.id,
    paymentModeId: cashMode.id,
  };
};
