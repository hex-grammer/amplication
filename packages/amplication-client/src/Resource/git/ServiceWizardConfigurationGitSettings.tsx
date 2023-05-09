import { EnumPanelStyle, Panel, Toggle } from "@amplication/ui/design-system";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./SyncWithGithubPage.scss";
import "./ServiceConfigurationGitSettings.scss";
import ProjectConfigurationGitSettings from "./ProjectConfigurationGitSettings";
import { AppContext } from "../../context/appContext";
import { useTracking } from "../../util/analytics";
import { AnalyticsEventNames } from "../../util/analytics-events.types";
import AuthWithGit from "./AuthWithGit";
import { FormikProps } from "formik";
import {
  GitRepositoryCreatedData,
  GitRepositorySelected,
} from "./dialogs/GitRepos/GithubRepos";
import GitSyncNotes from "./GitSyncNotes";

const CLASS_NAME = "service-configuration-github-settings";

type Props = {
  onDone: () => void;
  onGitRepositorySelected: (data: GitRepositorySelected) => void;
  onGitRepositoryCreated: (data: GitRepositoryCreatedData) => void;
  //onGitRepositoryDisconnected: () => void;
  formik: FormikProps<{ [key: string]: any }>;
};

const ServiceWizardConfigurationGitSettings: React.FC<Props> = ({
  onDone,
  onGitRepositorySelected,
  onGitRepositoryCreated,
  // onGitRepositoryDisconnected,
  formik,
}) => {
  const { currentProjectConfiguration, resources } = useContext(AppContext);
  const { trackEvent } = useTracking();
  const { gitRepository } = currentProjectConfiguration;
  const [isOverride, setIsOverride] = useState<boolean>(
    formik.values.isOverrideGitRepository ||
      (!gitRepository && resources.length > 0)
  );
  const settingsClassName = isOverride
    ? "gitSettingsPanel"
    : "gitSettingsFromProject";

  useEffect(() => {
    formik.setFieldValue("isOverrideGitRepository", isOverride);
  }, [formik.values]);

  const handleToggleChange = useCallback(
    (gitRepositoryOverride) => {
      setIsOverride(gitRepositoryOverride);
      formik.setFieldValue("isOverrideGitRepository", gitRepositoryOverride);
      if (!gitRepositoryOverride) {
        formik.setValues(
          {
            ...formik.values,
            gitRepositoryName: gitRepository?.name,
            gitOrganizationId: gitRepository?.gitOrganizationId,
            gitRepositoryUrl: `https://github.com/${gitRepository?.name}`,
            isOverrideGitRepository: false,
          },
          true
        );
      } else {
        formik.setValues(
          {
            ...formik.values,
            gitRepositoryName: null,
            gitOrganizationId: null,
            gitRepositoryUrl: null,
            isOverrideGitRepository: true,
          },
          true
        );
      }
      trackEvent({
        eventName: AnalyticsEventNames.ResourceInfoUpdate,
      });
    },
    [trackEvent, formik.values]
  );

  return (
    <div className={CLASS_NAME}>
      <div className={`${CLASS_NAME}__panelWarper`}>
        <ProjectConfigurationGitSettings
          isOverride={isOverride}
          isProjectSettingsLinkShow={false}
        />
        <Panel
          className={`${CLASS_NAME}__${settingsClassName}`}
          panelStyle={EnumPanelStyle.Transparent}
        >
          <div className={`${CLASS_NAME}__defaultSettings`}>
            <div>Override default settings</div>

            <div>
              <Toggle onValueChange={handleToggleChange} checked={isOverride} />
            </div>
          </div>
          {isOverride && (
            <div className={`${CLASS_NAME}__AuthWithGit`}>
              <hr />
              <AuthWithGit
                onDone={onDone}
                onGitRepositorySelected={onGitRepositorySelected}
                onGitRepositoryCreated={onGitRepositoryCreated}
                onGitRepositoryDisconnected={() => {
                  formik.setValues(
                    {
                      ...formik.values,
                      gitRepositoryName: null,
                      gitOrganizationId: null,
                      gitRepositoryUrl: null,
                    },
                    true
                  );
                }}
                gitRepositorySelected={{
                  gitOrganizationId: formik.values.gitOrganizationId,
                  repositoryName: formik.values.gitRepositoryName,
                  gitRepositoryUrl: formik.values.gitRepositoryUrl,
                }}
              />
            </div>
          )}
        </Panel>
        <GitSyncNotes />
      </div>
    </div>
  );
};

export default ServiceWizardConfigurationGitSettings;