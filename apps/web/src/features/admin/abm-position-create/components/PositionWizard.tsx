import { zodResolver } from '@hookform/resolvers/zod';
import type { AbmPositionFormOptions, CreateAbmPositionRequest } from '@delivery-commerce/shared';
import { AlertTriangle, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  useCities,
  useCreateAbmPosition,
  useDeliveryAddressDetail,
  useGovernorates,
  useLocalities,
  usePickupAddressDetail,
  usePostalCode,
} from '../hooks/use-abm-position-create';
import type { AbmAddressDetailResponse } from '../api/abm-position-create-api';
import {
  createPositionFormSchema,
  stepFieldMap,
  type CreatePositionFormOutput,
  type CreatePositionFormValues,
} from '../schemas/create-position.schema';
import { PositionWizardStepper } from './PositionWizardStepper';
import { TagInput } from './TagInput';

import { ErrorState } from '@/components/common/states';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiErrorUtils } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const DRAFT_KEY = 'delivery-commerce:abm-position-draft';
const NONE_VALUE = '__none__';

const todayIso = () => new Date().toISOString().slice(0, 10);

const buildDefaultValues = (options: AbmPositionFormOptions, draft?: Partial<CreatePositionFormValues>): CreatePositionFormValues => ({
  pickup: {
    addressBookId: draft?.pickup?.addressBookId ?? options.preferredPickupAddressId ?? '',
    contactLastName: draft?.pickup?.contactLastName ?? '',
    contactFirstName: draft?.pickup?.contactFirstName ?? '',
    addressLine1: draft?.pickup?.addressLine1 ?? '',
    addressLine2: draft?.pickup?.addressLine2 ?? '',
    governorateId: draft?.pickup?.governorateId ?? '',
    governorateName: draft?.pickup?.governorateName ?? '',
    cityId: draft?.pickup?.cityId ?? '',
    cityName: draft?.pickup?.cityName ?? '',
    localityId: draft?.pickup?.localityId ?? '',
    localityName: draft?.pickup?.localityName ?? '',
    postalCode: draft?.pickup?.postalCode ?? '',
    mobile: draft?.pickup?.mobile ?? '',
    phone: draft?.pickup?.phone ?? '',
    fax: draft?.pickup?.fax ?? '',
    email: draft?.pickup?.email ?? '',
  },
  delivery: {
    addressBookId: draft?.delivery?.addressBookId ?? '',
    contactLastName: draft?.delivery?.contactLastName ?? '',
    contactFirstName: draft?.delivery?.contactFirstName ?? '',
    addressLine1: draft?.delivery?.addressLine1 ?? '',
    addressLine2: draft?.delivery?.addressLine2 ?? '',
    governorateId: draft?.delivery?.governorateId ?? '',
    governorateName: draft?.delivery?.governorateName ?? '',
    cityId: draft?.delivery?.cityId ?? '',
    cityName: draft?.delivery?.cityName ?? '',
    localityId: draft?.delivery?.localityId ?? '',
    localityName: draft?.delivery?.localityName ?? '',
    postalCode: draft?.delivery?.postalCode ?? '',
    mobile: draft?.delivery?.mobile ?? '',
    phone: draft?.delivery?.phone ?? '',
    fax: '',
    email: '',
  },
  parcel: {
    pickupDate: draft?.parcel?.pickupDate ?? todayIso(),
    pickupTime: draft?.parcel?.pickupTime ?? options.defaults.pickupTime,
    weight: draft?.parcel?.weight ?? 1,
    pieces: draft?.parcel?.pieces ?? 1,
    reference: draft?.parcel?.reference ?? '',
    declaredValue: draft?.parcel?.declaredValue ?? 0,
    contents: draft?.parcel?.contents ?? [],
  },
  service: {
    serviceId:
      draft?.service?.serviceId ??
      options.serviceOptions.find((option) => option.selected)?.id ??
      options.serviceOptions[0]?.id ??
      '',
    codAmount: draft?.service?.codAmount ?? 0,
    paymentModeId:
      draft?.service?.paymentModeId ??
      options.paymentModeOptions.find((option) => option.selected)?.id ??
      options.paymentModeOptions[0]?.id ??
      '',
    exchange: draft?.service?.exchange ?? false,
    exchangeContents: draft?.service?.exchangeContents ?? '',
    allowOpen: draft?.service?.allowOpen ?? false,
  },
});

const readDraft = (): Partial<CreatePositionFormValues> | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const value = window.sessionStorage.getItem(DRAFT_KEY);
    return value ? (JSON.parse(value) as Partial<CreatePositionFormValues>) : undefined;
  } catch {
    return undefined;
  }
};

const writeDraft = (value: CreatePositionFormValues) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value));
};

const clearDraft = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(DRAFT_KEY);
};

const pickSafeErrorMessage = (error: unknown) => {
  if (!apiErrorUtils.isApiError(error)) {
    return 'Impossible de creer la position ABM.';
  }

  if (error.status === 503) {
    return "L'integration ABM n'est pas configuree.";
  }

  if (error.details && typeof error.details === 'object' && 'code' in error.details) {
    if (error.details.code === 'ABM_INVALID_COD_AMOUNT') {
      return 'Le montant a collecter est invalide.';
    }

    if (error.details.code === 'ABM_SESSION_EXPIRED') {
      return 'La session ABM a expire. Veuillez reessayer.';
    }

    if (error.details.code === 'ABM_SERVER_ERROR') {
      return 'ABM a rencontre une erreur interne pendant la creation.';
    }

    if (error.details.code === 'ABM_BAD_RESPONSE') {
      return 'ABM a retourne une reponse inattendue.';
    }

    if (error.details.code === 'ABM_POSITION_CREATION_FAILED') {
      return 'ABM a refuse la creation de la position.';
    }

    if (error.details.code === 'ABM_LOCATION_LOAD_FAILED') {
      return 'Impossible de charger les localites ABM.';
    }
  }

  return 'Impossible de creer la position ABM.';
};

export function PositionWizard({
  options,
}: {
  options: AbmPositionFormOptions;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const createPosition = useCreateAbmPosition();

  const form = useForm<CreatePositionFormValues, undefined, CreatePositionFormOutput>({
    resolver: zodResolver(createPositionFormSchema),
    defaultValues: buildDefaultValues(options),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    form.reset(buildDefaultValues(options, readDraft()));
  }, [form, options]);

  const handleNext = async () => {
    const valid = await form.trigger(stepFieldMap[currentStep as keyof typeof stepFieldMap] as never);

    if (!valid) {
      return;
    }

    writeDraft(form.getValues());
    setCompletedSteps((value) => Array.from(new Set([...value, currentStep])));
    setCurrentStep((value) => Math.min(value + 1, 3));
  };

  const handleSubmitRequest = async () => {
    const valid = await form.trigger();

    if (!valid) {
      return;
    }

    writeDraft(form.getValues());
    setReviewOpen(true);
  };

  const submit = form.handleSubmit(async (values) => {
    const result = await createPosition.mutateAsync(values as CreateAbmPositionRequest);
    clearDraft();
    setSuccessId(result.position.id);
    setReviewOpen(false);
    toast.success(`Position ${result.position.id} creee avec succes.`);
  });

  if (successId) {
    return (
      <div className="rounded-[2rem] border border-primary/15 bg-white p-8 shadow-soft">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Position creee</p>
          <h2 className="font-display text-3xl font-semibold">Position ABM {successId}</h2>
          <p className="text-sm text-muted-foreground">
            La position a ete envoyee a ABM. Vous pouvez lancer une nouvelle creation en repartant d&apos;un formulaire vide.
          </p>
          <Button
            type="button"
            onClick={() => {
              setSuccessId(null);
              setCompletedSteps([]);
              setCurrentStep(0);
              form.reset(buildDefaultValues(options));
            }}
          >
            Creer une autre position
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(event) => void submit(event)}>
        <PositionWizardStepper currentStep={currentStep} completedSteps={completedSteps} />

        <div className="rounded-[2rem] border border-border bg-white p-5 shadow-soft sm:p-8">
          {currentStep === 0 ? (
            <AddressStep
              type="pickup"
              title="Adresse d'enlevement"
              description="Selectionnez l'adresse depuis laquelle ABM recuperera le colis."
              addressBook={options.pickupAddressBook}
            />
          ) : null}

          {currentStep === 1 ? (
            <AddressStep
              type="delivery"
              title="Adresse de livraison"
              description="Renseignez les coordonnees exactes du client destinataire."
              addressBook={options.deliveryAddressBook}
            />
          ) : null}

          {currentStep === 2 ? <ParcelStep /> : null}
          {currentStep === 3 ? <ServiceStep options={options} /> : null}

          {createPosition.isError ? (
            <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {pickSafeErrorMessage(createPosition.error)}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((value) => Math.max(value - 1, 0))}
              disabled={currentStep === 0 || createPosition.isPending}
            >
              Precedent
            </Button>
            <div className="flex gap-3">
              {currentStep < 3 ? (
                <Button type="button" onClick={() => void handleNext()}>
                  Suivant
                </Button>
              ) : (
                <Button type="button" onClick={() => void handleSubmitRequest()} disabled={createPosition.isPending}>
                  {createPosition.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Valider la position
                </Button>
              )}
            </div>
          </div>
        </div>

        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          values={form.getValues()}
          submitting={createPosition.isPending}
          onConfirm={() => void submit()}
        />
      </form>
    </Form>
  );
}

function AddressStep({
  type,
  title,
  description,
  addressBook,
}: {
  type: 'pickup' | 'delivery';
  title: string;
  description: string;
  addressBook: AbmPositionFormOptions['pickupAddressBook'];
}) {
  const form = useFormContext<CreatePositionFormValues>();
  const addressBookId = useWatch({ control: form.control, name: `${type}.addressBookId` });
  const governorateId = useWatch({ control: form.control, name: `${type}.governorateId` });
  const cityId = useWatch({ control: form.control, name: `${type}.cityId` });
  const localityId = useWatch({ control: form.control, name: `${type}.localityId` });
  const postalCode = useWatch({ control: form.control, name: `${type}.postalCode` });
  const [isCustomized, setIsCustomized] = useState(false);
  const isHydratingRef = useRef(false);

  const governoratesQuery = useGovernorates();
  const citiesQuery = useCities(governorateId);
  const localitiesQuery = useLocalities(cityId);
  const postalCodeQuery = usePostalCode(localityId);
  const pickupDetailQuery = usePickupAddressDetail(type === 'pickup' ? (addressBookId ?? '') : '');
  const deliveryDetailQuery = useDeliveryAddressDetail(type === 'delivery' ? (addressBookId ?? '') : '');

  const detailQuery = type === 'pickup' ? pickupDetailQuery : deliveryDetailQuery;
  const appliedAddressIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!postalCodeQuery.data?.postalCode) {
      return;
    }

    if (postalCodeQuery.data.postalCode === postalCode) {
      return;
    }

    form.setValue(`${type}.postalCode`, postalCodeQuery.data.postalCode, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [form, postalCode, postalCodeQuery.data?.postalCode, type]);

  useEffect(() => {
    if (!addressBookId || !detailQuery.data || appliedAddressIdRef.current === addressBookId) {
      return;
    }

    appliedAddressIdRef.current = addressBookId;
    isHydratingRef.current = true;
    hydrateAddressFields(form, type, detailQuery.data);
    setIsCustomized(false);

    queueMicrotask(() => {
      isHydratingRef.current = false;
    });
  }, [addressBookId, detailQuery.data, form, type]);

  const markCustomized = () => {
    if (!addressBookId || isHydratingRef.current || isCustomized) {
      return;
    }

    setIsCustomized(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {addressBookId ? (
          <div className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {isCustomized ? 'Adresse personnalisee' : 'Adresse ABM selectionnee'}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ComboboxField
          name={`${type}.addressBookId`}
          label="Carnet d'adresses"
          placeholder="Choisir une adresse"
          items={addressBook.map((item) => ({ value: item.id, label: item.label }))}
          onValueChange={(value) => {
            appliedAddressIdRef.current = null;
            setIsCustomized(false);

            if (value === '') {
              clearHydratedAddressFields(form, type);
            }
          }}
          allowEmpty
        />
        <div className="hidden md:block" />
        <TextField name={`${type}.contactLastName`} label="Nom du contact *" onValueChange={markCustomized} />
        <TextField name={`${type}.contactFirstName`} label="Prenom" onValueChange={markCustomized} />
        <TextField name={`${type}.addressLine1`} label="Adresse *" className="md:col-span-2" onValueChange={markCustomized} />
        <TextField name={`${type}.addressLine2`} label="Complement" className="md:col-span-2" onValueChange={markCustomized} />

        <ComboboxField
          name={`${type}.governorateId`}
          label="Gouvernorat *"
          placeholder={governoratesQuery.isLoading ? 'Chargement...' : 'Choisir'}
          items={(governoratesQuery.data ?? []).map((item) => ({ value: item.id, label: item.label }))}
          disabled={governoratesQuery.isLoading}
          {...(governoratesQuery.isError
            ? { errorMessage: 'Impossible de charger les localites ABM.' }
            : {})}
          onValueChange={() => {
            markCustomized();
            form.setValue(`${type}.cityId`, '', { shouldDirty: true });
            form.setValue(`${type}.localityId`, '', { shouldDirty: true });
            form.setValue(`${type}.postalCode`, '', { shouldDirty: true });
          }}
        />

        <ComboboxField
          name={`${type}.cityId`}
          label="Ville *"
          placeholder={citiesQuery.isLoading ? 'Chargement...' : 'Choisir'}
          items={(citiesQuery.data ?? []).map((item) => ({ value: item.id, label: item.label }))}
          disabled={!governorateId || citiesQuery.isLoading}
          {...(citiesQuery.isError
            ? { errorMessage: 'Impossible de charger les localites ABM.' }
            : {})}
          onValueChange={() => {
            markCustomized();
            form.setValue(`${type}.localityId`, '', { shouldDirty: true });
            form.setValue(`${type}.postalCode`, '', { shouldDirty: true });
          }}
        />

        <ComboboxField
          name={`${type}.localityId`}
          label="Cite *"
          placeholder={localitiesQuery.isLoading ? 'Chargement...' : 'Choisir'}
          items={(localitiesQuery.data ?? []).map((item) => ({ value: item.id, label: item.label }))}
          disabled={!cityId || localitiesQuery.isLoading}
          {...(localitiesQuery.isError
            ? { errorMessage: 'Impossible de charger les localites ABM.' }
            : {})}
        />

        <TextField
          name={`${type}.postalCode`}
          label="Code postal *"
          disabled
          {...(postalCodeQuery.isFetching ? { helper: 'Mise a jour du code postal...' } : {})}
        />
        <TextField name={`${type}.mobile`} label="Mobile *" onValueChange={markCustomized} />
        <TextField name={`${type}.phone`} label="Telephone" onValueChange={markCustomized} />
        {type === 'pickup' ? <TextField name={`${type}.fax`} label="Fax" onValueChange={markCustomized} /> : <div className="hidden md:block" />}
        {type === 'pickup' ? <TextField name={`${type}.email`} label="Email" onValueChange={markCustomized} /> : <div className="hidden md:block" />}
      </div>

      {detailQuery.isError ? (
        <ErrorState message="Impossible de charger cette adresse ABM." onRetry={() => void detailQuery.refetch()} />
      ) : null}
    </div>
  );
}

function ParcelStep() {
  const form = useFormContext<CreatePositionFormValues>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Details de la position</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Decrivez le colis et choisissez la date d&apos;enlevement souhaitee.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TextField name="parcel.pickupDate" label="Date d'enlevement souhaitee *" type="date" min={todayIso()} />
        <TextField name="parcel.pickupTime" label="Heure d'enlevement *" type="time" />
        <NumberField name="parcel.weight" label="Poids en kg *" min={0.1} step={0.1} />
        <NumberField name="parcel.pieces" label="Nombre de pieces *" min={1} step={1} />
        <TextField name="parcel.reference" label="Reference" />
        <NumberField name="parcel.declaredValue" label="Valeur" min={0} step={1} />
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="parcel.contents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contenu</FormLabel>
                <FormControl>
                  <TagInput value={field.value ?? []} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function ServiceStep({
  options,
}: {
  options: AbmPositionFormOptions;
}) {
  const form = useFormContext<CreatePositionFormValues>();
  const exchange = useWatch({ control: form.control, name: 'service.exchange' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Type & services</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choisissez le service ABM et les options de reglement.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          name="service.serviceId"
          label="Type de service *"
          placeholder="Choisir"
          items={options.serviceOptions.map((item) => ({ value: item.id, label: item.label }))}
        />
        <NumberField name="service.codAmount" label="Montant a collecter *" min={0} step={1} />
        <SelectField
          name="service.paymentModeId"
          label="Mode de reglement *"
          placeholder="Choisir"
          items={options.paymentModeOptions.map((item) => ({ value: item.id, label: item.label }))}
        />
        <BooleanField name="service.exchange" label="Echange *" />
        {exchange ? <TextField name="service.exchangeContents" label="Contenu a recuperer *" className="md:col-span-2" /> : null}
        <BooleanField name="service.allowOpen" label="Autoriser l'ouverture du colis *" />
      </div>
    </div>
  );
}

function ReviewDialog({
  open,
  onOpenChange,
  values,
  submitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  values: CreatePositionFormValues;
  submitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Verifier avant envoi</AlertDialogTitle>
          <AlertDialogDescription>
            Verifiez les informations normalisees avant la creation de la position ABM.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewCard title="Enlevement" lines={[
            values.pickup.contactLastName,
            values.pickup.addressLine1,
            `${values.pickup.localityId} - ${values.pickup.postalCode}`,
            values.pickup.mobile,
          ]} />
          <ReviewCard title="Livraison" lines={[
            values.delivery.contactLastName,
            values.delivery.addressLine1,
            `${values.delivery.localityId} - ${values.delivery.postalCode}`,
            values.delivery.mobile,
          ]} />
          <ReviewCard title="Colis" lines={[
            `Date: ${values.parcel.pickupDate} a ${values.parcel.pickupTime}`,
            `Poids: ${values.parcel.weight} kg`,
            `Pieces: ${values.parcel.pieces}`,
            `Contenu: ${values.parcel.contents?.join(', ') || 'Aucun'}`,
          ]} />
          <ReviewCard title="Service" lines={[
            `Service: ${values.service.serviceId}`,
            `Montant: ${values.service.codAmount}`,
            `Reglement: ${values.service.paymentModeId}`,
            `Ouverture: ${values.service.allowOpen ? 'Oui' : 'Non'}`,
          ]} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Modifier</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirmer et creer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ReviewCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-3xl border border-border bg-secondary/40 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function TextField({
  name,
  label,
  className,
  helper,
  onValueChange,
  ...props
}: React.ComponentProps<typeof Input> & {
  name: any;
  label: string;
  className?: string;
  helper?: string | undefined;
  onValueChange?: () => void;
}) {
  const form = useFormContext<CreatePositionFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...props}
              {...field}
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event);
                onValueChange?.();
              }}
            />
          </FormControl>
          {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function NumberField({
  name,
  label,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  name: any;
  label: string;
  className?: string;
}) {
  const form = useFormContext<CreatePositionFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...props}
              type="number"
              value={field.value ?? 0}
              onChange={(event) => field.onChange(event.target.value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  name,
  label,
  items,
  placeholder,
  disabled,
  className,
  onValueChange,
  allowEmpty = false,
  errorMessage,
}: {
  name: any;
  label: string;
  items: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean | undefined;
  className?: string;
  onValueChange?: (value: string) => void;
  allowEmpty?: boolean;
  errorMessage?: string | undefined;
}) {
  const form = useFormContext<CreatePositionFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Select
            {...(disabled !== undefined ? { disabled } : {})}
            value={field.value || NONE_VALUE}
            onValueChange={(value) => {
              field.onChange(value === NONE_VALUE ? '' : value);
              onValueChange?.(value);
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE_VALUE} disabled={!allowEmpty}>
                {allowEmpty ? 'Aucune selection' : placeholder}
              </SelectItem>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorMessage ? (
            <p className="flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="size-3" />
              {errorMessage}
            </p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ComboboxField({
  name,
  label,
  items,
  placeholder,
  disabled,
  className,
  onValueChange,
  allowEmpty = false,
  errorMessage,
}: {
  name: any;
  label: string;
  items: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean | undefined;
  className?: string;
  onValueChange?: (value: string) => void;
  allowEmpty?: boolean;
  errorMessage?: string | undefined;
}) {
  const form = useFormContext<CreatePositionFormValues>();
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedItem = items.find((item) => item.value === field.value);

        return (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-11 w-full justify-between rounded-xl border-input bg-background px-3 text-sm font-normal"
                  >
                    <span className={cn('truncate', !selectedItem && 'text-muted-foreground')}>
                      {selectedItem?.label ?? placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder={`Rechercher ${label.toLowerCase()}...`} />
                  <CommandList>
                    <CommandEmpty>Aucun resultat.</CommandEmpty>
                    {allowEmpty ? (
                      <CommandItem
                        value="Aucune selection"
                        selected={!field.value}
                        onSelect={() => {
                          field.onChange('');
                          onValueChange?.('');
                          setOpen(false);
                        }}
                      >
                        Aucune selection
                      </CommandItem>
                    ) : null}
                    {items.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.label}
                        selected={field.value === item.value}
                        onSelect={() => {
                          field.onChange(item.value);
                          onValueChange?.(item.value);
                          setOpen(false);
                        }}
                      >
                        <span className="truncate">{item.label}</span>
                        {field.value === item.value ? <Check className="ml-auto size-4" /> : null}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errorMessage ? (
              <p className="flex items-center gap-2 text-xs text-destructive">
                <AlertTriangle className="size-3" />
                {errorMessage}
              </p>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function BooleanField({ name, label }: { name: any; label: string }) {
  const form = useFormContext<CreatePositionFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="grid grid-cols-2 gap-2">
              {[{ label: 'Non', value: false }, { label: 'Oui', value: true }].map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant={field.value === option.value ? 'default' : 'outline'}
                  className={cn('justify-center', field.value === option.value && 'shadow-soft')}
                  onClick={() => field.onChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function hydrateAddressFields(
  form: ReturnType<typeof useForm<CreatePositionFormValues>>,
  type: 'pickup' | 'delivery',
  address: AbmAddressDetailResponse,
) {
  const entries = Object.entries(address) as Array<[keyof AbmAddressDetailResponse, string | undefined]>;

  for (const [key, value] of entries) {
    if (key === 'id') {
      continue;
    }

    form.setValue(`${type}.${key}` as any, value ?? '', {
      shouldDirty: false,
      shouldValidate: true,
    });
  }
}

function clearHydratedAddressFields(
  form: ReturnType<typeof useForm<CreatePositionFormValues>>,
  type: 'pickup' | 'delivery',
) {
  const keys = [
    'contactLastName',
    'contactFirstName',
    'addressLine1',
    'addressLine2',
    'governorateId',
    'governorateName',
    'cityId',
    'cityName',
    'localityId',
    'localityName',
    'postalCode',
    'mobile',
    'phone',
    'fax',
    'email',
  ] as const;

  for (const key of keys) {
    form.setValue(`${type}.${key}` as any, '', {
      shouldDirty: false,
      shouldValidate: false,
    });
  }
}
