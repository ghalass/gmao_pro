import NewSaisiehrm from "./_components/new-saisiehrm";
import HrmList from "./_components/hrm-list";

const SaisiehrmsPage = () => {
  return (
    <div className="mx-auto p-4 max-w-[1400px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saisies HRM</h1>
          <p className="text-sm text-muted-foreground">
            Gérez et suivez les heures de marche des engins et les interventions
            associées.
          </p>
        </div>
        <div>
          <NewSaisiehrm />
        </div>
      </div>

      <HrmList />
    </div>
  );
};

export default SaisiehrmsPage;
