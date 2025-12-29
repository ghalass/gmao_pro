import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";

type FormCheckboxProps = {
  form: any;
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function FormCheckbox({
  form,
  name,
  label,
  description,
  disabled = false,
  required = false,
  className = "",
}: FormCheckboxProps) {
  return (
    <form.Field name={name}>
      {(field: any) => {
        const error =
          field.state.meta.errors.length > 0
            ? field.state.meta.errors[0]
            : undefined;
        const fieldName = field.name as string;
        const isTouched = field.state.meta.isTouched;
        const showError = isTouched && error;

        return (
          <Field className={`gap-2 ${className}`}>
            <div className="flex items-start space-x-2">
              <Checkbox
                id={fieldName}
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  field.handleChange(checked === true);
                  field.handleBlur();
                }}
                disabled={disabled}
                className={showError ? "border-red-500" : ""}
                aria-invalid={!!showError}
                aria-describedby={
                  showError
                    ? `${fieldName}-error`
                    : description
                    ? `${fieldName}-description`
                    : undefined
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={fieldName}
                  className="text-sm font-normal cursor-pointer"
                >
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
                {showError && (
                  <p className="text-sm text-red-500" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </Field>
        );
      }}
    </form.Field>
  );
}
