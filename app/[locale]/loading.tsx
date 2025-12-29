import { Spinner } from "@/components/ui/spinner";
import { getI18n } from "@/locales/server";

const loading = async () => {
  const t = await getI18n();
  return (
    <div className="flex items-center justify-center mt-12">
      <div className="text-center space-y-4">
        <Spinner className="mx-auto" />
        <p className="text-muted-foreground animate-pulse">
          {t("common.loading")}
        </p>
      </div>
    </div>
  );
};

export default loading;
