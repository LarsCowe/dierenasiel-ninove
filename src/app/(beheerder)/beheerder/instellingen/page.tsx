import { getWorkflowSettings } from "@/lib/queries/shelter-settings";
import { getWalkingClubThreshold } from "@/lib/queries/shelter-settings";
import WorkflowSettingsPanel from "@/components/beheerder/instellingen/WorkflowSettingsPanel";
import ThresholdSettingPanel from "@/components/beheerder/instellingen/ThresholdSettingPanel";
import DatabaseResetPanel from "@/components/beheerder/instellingen/DatabaseResetPanel";

export default async function InstellingenPage() {
  const [workflowSettings, threshold] = await Promise.all([
    getWorkflowSettings(),
    getWalkingClubThreshold(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Instellingen
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Beheer de configuratie van het asiel-systeem.
        </p>
      </div>

      <section className="mt-6">
        <WorkflowSettingsPanel settings={workflowSettings} />
      </section>

      <section className="mt-6">
        <ThresholdSettingPanel threshold={threshold} />
      </section>

      <section className="mt-6">
        <DatabaseResetPanel />
      </section>
    </div>
  );
}
