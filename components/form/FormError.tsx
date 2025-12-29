import { Alert, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";

const FormError = ({ error }: { error: string | null | undefined }) => {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
    </>
  );
};

export default FormError;
