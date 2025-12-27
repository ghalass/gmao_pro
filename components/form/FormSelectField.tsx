import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { ObjectSchema } from "yup";

type Option = {
    label: string;
    value: string;
};

type FormSelectFieldProps = {
    form: any;
    name: string;
    label: string;
    placeholder?: string;
    options: Option[];
    groupLabel?: string;
    disabled?: boolean;
    validationSchema?: ObjectSchema<any>;
    customValidator?: (value: string) => string | undefined;
    required?: boolean;
};

export function FormSelectField({
    form,
    name,
    label,
    placeholder = "Sélectionner...",
    options,
    groupLabel,
    disabled = false,
    validationSchema,
    customValidator,
    required = false,
}: FormSelectFieldProps) {
    const getValidator = () => {
        // Priorité à la validation personnalisée
        if (customValidator) {
            return {
                onChange: ({ value }: { value: string }) => customValidator(value),
            };
        }

        // Utiliser le schéma Yup si fourni
        if (validationSchema) {
            return {
                onChange: ({ value }: { value: string }) => {
                    try {
                        const validationObj = { [name]: value };
                        validationSchema.validateSyncAt(name, validationObj);
                        return undefined;
                    } catch (err: any) {
                        return err.message || "Erreur de validation";
                    }
                },
            };
        }

        // Validation basique si required
        if (required) {
            return {
                onChange: ({ value }: { value: string }) => {
                    if (!value || value.trim() === '') {
                        return `Le champ "${label}" est requis`;
                    }
                    return undefined;
                },
            };
        }

        // Pas de validation
        return {};
    };

    return (
        <form.Field
            name={name}
            validators={getValidator()}
        >
            {(field: any) => {
                const error = field.state.meta.isTouched && field.state.meta.errors[0];
                const fieldName = field.name as string;

                return (
                    <Field className="gap-0.5">
                        <FieldLabel htmlFor={fieldName}>
                            {label}
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>

                        <Select
                            value={field.state.value}
                            onValueChange={(value) => {
                                field.handleChange(value || undefined);
                                // Déclencher la validation après le changement
                                setTimeout(() => field.handleBlur(), 0);
                            }}
                            disabled={disabled}
                        >
                            <SelectTrigger
                                id={fieldName}
                                className={`w-full ${error ? "border-red-500" : ""}`}
                                aria-invalid={!!error}
                                aria-describedby={error ? `${fieldName}-error` : undefined}
                            >
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectGroup>
                                    {groupLabel && <SelectLabel>{groupLabel}</SelectLabel>}

                                    {options.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {error && (
                            <p
                                id={`${fieldName}-error`}
                                className="text-sm text-red-500 mt-1"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
                    </Field>
                );
            }}
        </form.Field>
    );
}
