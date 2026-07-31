import type {
  AbmLocationOption,
  AbmPositionAddress,
  AbmPositionFormOptions,
  AbmSelectOption,
  CreateAbmPositionRequest,
  CreateAbmPositionResponse,
} from '@delivery-commerce/shared';

export interface AbmPositionFormPageData {
  pickupAddressBook: AbmSelectOption[];
  deliveryAddressBook: AbmSelectOption[];
  governorates: AbmLocationOption[];
  serviceOptions: AbmSelectOption[];
  paymentModeOptions: AbmSelectOption[];
  packagingOptions: AbmSelectOption[];
  merchandiseTypeOptions: AbmSelectOption[];
  defaults: AbmPositionFormOptions['defaults'];
  preferredPickupAddressId?: string | undefined;
  csrfToken: string;
}

export interface AbmAddressBookResult {
  pickupAddressBook: AbmSelectOption[];
  deliveryAddressBook: AbmSelectOption[];
  preferredPickupAddressId?: string | undefined;
}

export interface AbmPositionCreateSubmissionContext {
  formPage: AbmPositionFormPageData;
  payload: CreateAbmPositionRequest;
}

export interface AbmPositionCreateResult extends CreateAbmPositionResponse {}

export interface AbmMappedAddress extends AbmPositionAddress {}
