import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useCities, useCreateAbmPosition, useDeliveryAddressDetail, useGovernorates, useLocalities, usePickupAddressDetail, usePostalCode, } from '../hooks/use-abm-position-create';
import { createPositionFormSchema, stepFieldMap, } from '../schemas/create-position.schema';
import { PositionWizardStepper } from './PositionWizardStepper';
import { TagInput } from './TagInput';
import { ErrorState } from '@/components/common/states';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { apiErrorUtils } from '@/lib/api-client';
import { cn } from '@/lib/utils';
const DRAFT_KEY = 'delivery-commerce:abm-position-draft';
const NONE_VALUE = '__none__';
const todayIso = () => new Date().toISOString().slice(0, 10);
const buildDefaultValues = (options, draft) => ({
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
        serviceId: draft?.service?.serviceId ??
            options.serviceOptions.find((option) => option.selected)?.id ??
            options.serviceOptions[0]?.id ??
            '',
        codAmount: draft?.service?.codAmount ?? 0,
        paymentModeId: draft?.service?.paymentModeId ??
            options.paymentModeOptions.find((option) => option.selected)?.id ??
            options.paymentModeOptions[0]?.id ??
            '',
        exchange: draft?.service?.exchange ?? false,
        exchangeContents: draft?.service?.exchangeContents ?? '',
        allowOpen: draft?.service?.allowOpen ?? false,
    },
});
const readDraft = () => {
    if (typeof window === 'undefined') {
        return undefined;
    }
    try {
        const value = window.sessionStorage.getItem(DRAFT_KEY);
        return value ? JSON.parse(value) : undefined;
    }
    catch {
        return undefined;
    }
};
const writeDraft = (value) => {
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
const pickSafeErrorMessage = (error) => {
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
export function PositionWizard({ options, }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [successId, setSuccessId] = useState(null);
    const initializedRef = useRef(false);
    const createPosition = useCreateAbmPosition();
    const form = useForm({
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
        const valid = await form.trigger(stepFieldMap[currentStep]);
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
        const result = await createPosition.mutateAsync(values);
        clearDraft();
        setSuccessId(result.position.id);
        setReviewOpen(false);
        toast.success(`Position ${result.position.id} creee avec succes.`);
    });
    if (successId) {
        return (_jsx("div", { className: "rounded-[2rem] border border-primary/15 bg-white p-8 shadow-soft", children: _jsxs("div", { className: "max-w-2xl space-y-4", children: [_jsx("p", { className: "text-sm font-medium uppercase tracking-[0.2em] text-primary", children: "Position creee" }), _jsxs("h2", { className: "font-display text-3xl font-semibold", children: ["Position ABM ", successId] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "La position a ete envoyee a ABM. Vous pouvez lancer une nouvelle creation en repartant d'un formulaire vide." }), _jsx(Button, { type: "button", onClick: () => {
                            setSuccessId(null);
                            setCompletedSteps([]);
                            setCurrentStep(0);
                            form.reset(buildDefaultValues(options));
                        }, children: "Creer une autre position" })] }) }));
    }
    return (_jsx(Form, { ...form, children: _jsxs("form", { className: "space-y-6", onSubmit: (event) => void submit(event), children: [_jsx(PositionWizardStepper, { currentStep: currentStep, completedSteps: completedSteps }), _jsxs("div", { className: "rounded-[2rem] border border-border bg-white p-5 shadow-soft sm:p-8", children: [currentStep === 0 ? (_jsx(AddressStep, { type: "pickup", title: "Adresse d'enlevement", description: "Selectionnez l'adresse depuis laquelle ABM recuperera le colis.", addressBook: options.pickupAddressBook })) : null, currentStep === 1 ? (_jsx(AddressStep, { type: "delivery", title: "Adresse de livraison", description: "Renseignez les coordonnees exactes du client destinataire.", addressBook: options.deliveryAddressBook })) : null, currentStep === 2 ? _jsx(ParcelStep, {}) : null, currentStep === 3 ? _jsx(ServiceStep, { options: options }) : null, createPosition.isError ? (_jsx("div", { className: "mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive", children: pickSafeErrorMessage(createPosition.error) })) : null, _jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setCurrentStep((value) => Math.max(value - 1, 0)), disabled: currentStep === 0 || createPosition.isPending, children: "Precedent" }), _jsx("div", { className: "flex gap-3", children: currentStep < 3 ? (_jsx(Button, { type: "button", onClick: () => void handleNext(), children: "Suivant" })) : (_jsxs(Button, { type: "button", onClick: () => void handleSubmitRequest(), disabled: createPosition.isPending, children: [createPosition.isPending ? _jsx(Loader2, { className: "size-4 animate-spin" }) : null, "Valider la position"] })) })] })] }), _jsx(ReviewDialog, { open: reviewOpen, onOpenChange: setReviewOpen, values: form.getValues(), submitting: createPosition.isPending, onConfirm: () => void submit() })] }) }));
}
function AddressStep({ type, title, description, addressBook, }) {
    const form = useFormContext();
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
    const appliedAddressIdRef = useRef(null);
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-display text-2xl font-semibold", children: title }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: description }), addressBookId ? (_jsx("div", { className: "mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary", children: isCustomized ? 'Adresse personnalisee' : 'Adresse ABM selectionnee' })) : null] }), _jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [_jsx(ComboboxField, { name: `${type}.addressBookId`, label: "Carnet d'adresses", placeholder: "Choisir une adresse", items: addressBook.map((item) => ({ value: item.id, label: item.label })), onValueChange: (value) => {
                            appliedAddressIdRef.current = null;
                            setIsCustomized(false);
                            if (value === '') {
                                clearHydratedAddressFields(form, type);
                            }
                        }, allowEmpty: true }), _jsx("div", { className: "hidden md:block" }), _jsx(TextField, { name: `${type}.contactLastName`, label: "Nom du contact *", onValueChange: markCustomized }), _jsx(TextField, { name: `${type}.contactFirstName`, label: "Prenom", onValueChange: markCustomized }), _jsx(TextField, { name: `${type}.addressLine1`, label: "Adresse *", className: "md:col-span-2", onValueChange: markCustomized }), _jsx(TextField, { name: `${type}.addressLine2`, label: "Complement", className: "md:col-span-2", onValueChange: markCustomized }), _jsx(ComboboxField, { name: `${type}.governorateId`, label: "Gouvernorat *", placeholder: governoratesQuery.isLoading ? 'Chargement...' : 'Choisir', items: (governoratesQuery.data ?? []).map((item) => ({ value: item.id, label: item.label })), disabled: governoratesQuery.isLoading, ...(governoratesQuery.isError
                            ? { errorMessage: 'Impossible de charger les localites ABM.' }
                            : {}), onValueChange: () => {
                            markCustomized();
                            form.setValue(`${type}.cityId`, '', { shouldDirty: true });
                            form.setValue(`${type}.localityId`, '', { shouldDirty: true });
                            form.setValue(`${type}.postalCode`, '', { shouldDirty: true });
                        } }), _jsx(ComboboxField, { name: `${type}.cityId`, label: "Ville *", placeholder: citiesQuery.isLoading ? 'Chargement...' : 'Choisir', items: (citiesQuery.data ?? []).map((item) => ({ value: item.id, label: item.label })), disabled: !governorateId || citiesQuery.isLoading, ...(citiesQuery.isError
                            ? { errorMessage: 'Impossible de charger les localites ABM.' }
                            : {}), onValueChange: () => {
                            markCustomized();
                            form.setValue(`${type}.localityId`, '', { shouldDirty: true });
                            form.setValue(`${type}.postalCode`, '', { shouldDirty: true });
                        } }), _jsx(ComboboxField, { name: `${type}.localityId`, label: "Cite *", placeholder: localitiesQuery.isLoading ? 'Chargement...' : 'Choisir', items: (localitiesQuery.data ?? []).map((item) => ({ value: item.id, label: item.label })), disabled: !cityId || localitiesQuery.isLoading, ...(localitiesQuery.isError
                            ? { errorMessage: 'Impossible de charger les localites ABM.' }
                            : {}) }), _jsx(TextField, { name: `${type}.postalCode`, label: "Code postal *", disabled: true, ...(postalCodeQuery.isFetching ? { helper: 'Mise a jour du code postal...' } : {}) }), _jsx(TextField, { name: `${type}.mobile`, label: "Mobile *", onValueChange: markCustomized }), _jsx(TextField, { name: `${type}.phone`, label: "Telephone", onValueChange: markCustomized }), type === 'pickup' ? _jsx(TextField, { name: `${type}.fax`, label: "Fax", onValueChange: markCustomized }) : _jsx("div", { className: "hidden md:block" }), type === 'pickup' ? _jsx(TextField, { name: `${type}.email`, label: "Email", onValueChange: markCustomized }) : _jsx("div", { className: "hidden md:block" })] }), detailQuery.isError ? (_jsx(ErrorState, { message: "Impossible de charger cette adresse ABM.", onRetry: () => void detailQuery.refetch() })) : null] }));
}
function ParcelStep() {
    const form = useFormContext();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-display text-2xl font-semibold", children: "Details de la position" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Decrivez le colis et choisissez la date d'enlevement souhaitee." })] }), _jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [_jsx(TextField, { name: "parcel.pickupDate", label: "Date d'enlevement souhaitee *", type: "date", min: todayIso() }), _jsx(TextField, { name: "parcel.pickupTime", label: "Heure d'enlevement *", type: "time" }), _jsx(NumberField, { name: "parcel.weight", label: "Poids en kg *", min: 0.1, step: 0.1 }), _jsx(NumberField, { name: "parcel.pieces", label: "Nombre de pieces *", min: 1, step: 1 }), _jsx(TextField, { name: "parcel.reference", label: "Reference" }), _jsx(NumberField, { name: "parcel.declaredValue", label: "Valeur", min: 0, step: 1 }), _jsx("div", { className: "md:col-span-2", children: _jsx(FormField, { control: form.control, name: "parcel.contents", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contenu" }), _jsx(FormControl, { children: _jsx(TagInput, { value: field.value ?? [], onChange: field.onChange }) }), _jsx(FormMessage, {})] })) }) })] })] }));
}
function ServiceStep({ options, }) {
    const form = useFormContext();
    const exchange = useWatch({ control: form.control, name: 'service.exchange' });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-display text-2xl font-semibold", children: "Type & services" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Choisissez le service ABM et les options de reglement." })] }), _jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [_jsx(SelectField, { name: "service.serviceId", label: "Type de service *", placeholder: "Choisir", items: options.serviceOptions.map((item) => ({ value: item.id, label: item.label })) }), _jsx(NumberField, { name: "service.codAmount", label: "Montant a collecter *", min: 0, step: 1 }), _jsx(SelectField, { name: "service.paymentModeId", label: "Mode de reglement *", placeholder: "Choisir", items: options.paymentModeOptions.map((item) => ({ value: item.id, label: item.label })) }), _jsx(BooleanField, { name: "service.exchange", label: "Echange *" }), exchange ? _jsx(TextField, { name: "service.exchangeContents", label: "Contenu a recuperer *", className: "md:col-span-2" }) : null, _jsx(BooleanField, { name: "service.allowOpen", label: "Autoriser l'ouverture du colis *" })] })] }));
}
function ReviewDialog({ open, onOpenChange, values, submitting, onConfirm, }) {
    return (_jsx(AlertDialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(AlertDialogContent, { className: "max-w-3xl", children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Verifier avant envoi" }), _jsx(AlertDialogDescription, { children: "Verifiez les informations normalisees avant la creation de la position ABM." })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(ReviewCard, { title: "Enlevement", lines: [
                                values.pickup.contactLastName,
                                values.pickup.addressLine1,
                                `${values.pickup.localityId} - ${values.pickup.postalCode}`,
                                values.pickup.mobile,
                            ] }), _jsx(ReviewCard, { title: "Livraison", lines: [
                                values.delivery.contactLastName,
                                values.delivery.addressLine1,
                                `${values.delivery.localityId} - ${values.delivery.postalCode}`,
                                values.delivery.mobile,
                            ] }), _jsx(ReviewCard, { title: "Colis", lines: [
                                `Date: ${values.parcel.pickupDate} a ${values.parcel.pickupTime}`,
                                `Poids: ${values.parcel.weight} kg`,
                                `Pieces: ${values.parcel.pieces}`,
                                `Contenu: ${values.parcel.contents?.join(', ') || 'Aucun'}`,
                            ] }), _jsx(ReviewCard, { title: "Service", lines: [
                                `Service: ${values.service.serviceId}`,
                                `Montant: ${values.service.codAmount}`,
                                `Reglement: ${values.service.paymentModeId}`,
                                `Ouverture: ${values.service.allowOpen ? 'Oui' : 'Non'}`,
                            ] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: submitting, children: "Modifier" }), _jsxs(AlertDialogAction, { onClick: (event) => {
                                event.preventDefault();
                                onConfirm();
                            }, disabled: submitting, children: [submitting ? _jsx(Loader2, { className: "size-4 animate-spin" }) : null, "Confirmer et creer"] })] })] }) }));
}
function ReviewCard({ title, lines }) {
    return (_jsxs("div", { className: "rounded-3xl border border-border bg-secondary/40 p-4", children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: title }), _jsx("div", { className: "mt-3 space-y-1 text-sm text-muted-foreground", children: lines.map((line) => (_jsx("p", { children: line }, line))) })] }));
}
function TextField({ name, label, className, helper, onValueChange, ...props }) {
    const form = useFormContext();
    return (_jsx(FormField, { control: form.control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: className, children: [_jsx(FormLabel, { children: label }), _jsx(FormControl, { children: _jsx(Input, { ...props, ...field, value: field.value ?? '', onChange: (event) => {
                            field.onChange(event);
                            onValueChange?.();
                        } }) }), helper ? _jsx("p", { className: "text-xs text-muted-foreground", children: helper }) : null, _jsx(FormMessage, {})] })) }));
}
function NumberField({ name, label, className, ...props }) {
    const form = useFormContext();
    return (_jsx(FormField, { control: form.control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: className, children: [_jsx(FormLabel, { children: label }), _jsx(FormControl, { children: _jsx(Input, { ...props, type: "number", value: field.value ?? 0, onChange: (event) => field.onChange(event.target.value) }) }), _jsx(FormMessage, {})] })) }));
}
function SelectField({ name, label, items, placeholder, disabled, className, onValueChange, allowEmpty = false, errorMessage, }) {
    const form = useFormContext();
    return (_jsx(FormField, { control: form.control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: className, children: [_jsx(FormLabel, { children: label }), _jsxs(Select, { ...(disabled !== undefined ? { disabled } : {}), value: field.value || NONE_VALUE, onValueChange: (value) => {
                        field.onChange(value === NONE_VALUE ? '' : value);
                        onValueChange?.(value);
                    }, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: placeholder }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: NONE_VALUE, disabled: !allowEmpty, children: allowEmpty ? 'Aucune selection' : placeholder }), items.map((item) => (_jsx(SelectItem, { value: item.value, children: item.label }, item.value)))] })] }), errorMessage ? (_jsxs("p", { className: "flex items-center gap-2 text-xs text-destructive", children: [_jsx(AlertTriangle, { className: "size-3" }), errorMessage] })) : null, _jsx(FormMessage, {})] })) }));
}
function ComboboxField({ name, label, items, placeholder, disabled, className, onValueChange, allowEmpty = false, errorMessage, }) {
    const form = useFormContext();
    const [open, setOpen] = useState(false);
    return (_jsx(FormField, { control: form.control, name: name, render: ({ field }) => {
            const selectedItem = items.find((item) => item.value === field.value);
            return (_jsxs(FormItem, { className: className, children: [_jsx(FormLabel, { children: label }), _jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { type: "button", variant: "outline", role: "combobox", "aria-expanded": open, disabled: disabled, className: "h-11 w-full justify-between rounded-xl border-input bg-background px-3 text-sm font-normal", children: [_jsx("span", { className: cn('truncate', !selectedItem && 'text-muted-foreground'), children: selectedItem?.label ?? placeholder }), _jsx(ChevronsUpDown, { className: "ml-2 size-4 shrink-0 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-(--radix-popover-trigger-width) p-0", align: "start", children: _jsxs(Command, { children: [_jsx(CommandInput, { placeholder: `Rechercher ${label.toLowerCase()}...` }), _jsxs(CommandList, { children: [_jsx(CommandEmpty, { children: "Aucun resultat." }), allowEmpty ? (_jsx(CommandItem, { value: "Aucune selection", selected: !field.value, onSelect: () => {
                                                        field.onChange('');
                                                        onValueChange?.('');
                                                        setOpen(false);
                                                    }, children: "Aucune selection" })) : null, items.map((item) => (_jsxs(CommandItem, { value: item.label, selected: field.value === item.value, onSelect: () => {
                                                        field.onChange(item.value);
                                                        onValueChange?.(item.value);
                                                        setOpen(false);
                                                    }, children: [_jsx("span", { className: "truncate", children: item.label }), field.value === item.value ? _jsx(Check, { className: "ml-auto size-4" }) : null] }, item.value)))] })] }) })] }), errorMessage ? (_jsxs("p", { className: "flex items-center gap-2 text-xs text-destructive", children: [_jsx(AlertTriangle, { className: "size-3" }), errorMessage] })) : null, _jsx(FormMessage, {})] }));
        } }));
}
function BooleanField({ name, label }) {
    const form = useFormContext();
    return (_jsx(FormField, { control: form.control, name: name, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: label }), _jsx(FormControl, { children: _jsx("div", { className: "grid grid-cols-2 gap-2", children: [{ label: 'Non', value: false }, { label: 'Oui', value: true }].map((option) => (_jsx(Button, { type: "button", variant: field.value === option.value ? 'default' : 'outline', className: cn('justify-center', field.value === option.value && 'shadow-soft'), onClick: () => field.onChange(option.value), children: option.label }, option.label))) }) }), _jsx(FormMessage, {})] })) }));
}
function hydrateAddressFields(form, type, address) {
    const entries = Object.entries(address);
    for (const [key, value] of entries) {
        if (key === 'id') {
            continue;
        }
        form.setValue(`${type}.${key}`, value ?? '', {
            shouldDirty: false,
            shouldValidate: true,
        });
    }
}
function clearHydratedAddressFields(form, type) {
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
    ];
    for (const key of keys) {
        form.setValue(`${type}.${key}`, '', {
            shouldDirty: false,
            shouldValidate: false,
        });
    }
}
