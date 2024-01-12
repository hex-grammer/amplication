import {
  Button,
  CircularProgress,
  HorizontalRule,
  Label,
  TextField,
  Toggle,
} from "@amplication/ui/design-system";
import { ApolloError, useQuery } from "@apollo/client";
import { Form, Formik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { CreateGitRepositoryInput } from "../../../../models";
import { formatError } from "../../../../util/error";
import { CreateGitFormSchema } from "./CreateGitFormSchema/CreateGitFormSchema";
import "./GitCreateRepo.scss";
import { GitSelectMenu } from "../../select/GitSelectMenu";
import { GitOrganizationFromGitRepository } from "../../SyncWithGithubPage";
import { GET_GROUPS } from "../../queries/gitProvider";

type Props = {
  gitOrganization: GitOrganizationFromGitRepository;
  repoCreated: {
    isRepoCreateLoading: boolean;
    RepoCreatedError: ApolloError;
  };
  onCreateGitRepository: (data: CreateGitRepositoryInput) => void;
};

const CLASS_NAME = "git-create-repo";

export default function GitCreateRepo({
  gitOrganization,
  repoCreated,
  onCreateGitRepository,
}: Props) {
  const initialValues: Partial<CreateGitRepositoryInput> = {
    name: "",
    isPublic: true,
  };

  const { data: gitGroupsData } = useQuery(GET_GROUPS, {
    variables: {
      organizationId: gitOrganization.id,
    },
    skip: !gitOrganization.useGroupingForRepositories,
  });

  const gitGroups = gitGroupsData?.gitGroups?.groups;
  const [repositoryGroup, setRepositoryGroup] = useState(null);

  useEffect(() => {
    if (!repositoryGroup && gitGroups && gitGroups.length > 0) {
      setRepositoryGroup(gitGroups[0]);
    }
  }, [gitGroups]);

  const processGitRepositoryName = useCallback((name: string) => {
    if (!name || name.length < 2) {
      return null;
    }
    return name
      .replace(/[^a-zA-Z0-9.\-_]/g, "-") // Replace characters other than ASCII letters, digits, ., -, and _ with -
      .replace(/-{2,}/g, "-"); // Replace consecutive dashes with a single dash
  }, []);

  const handleCreation = useCallback(
    (data: CreateGitRepositoryInput) => {
      const inputData = repositoryGroup
        ? {
            ...data,
            groupName: repositoryGroup.name,
            name: processGitRepositoryName(data.name),
          }
        : { ...data, name: processGitRepositoryName(data.name) };
      onCreateGitRepository(inputData);
    },
    [repositoryGroup]
  );

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleCreation}
      validationSchema={CreateGitFormSchema}
      validateOnChange={false}
      validateOnBlur
    >
      {({ errors: formError, values, handleChange }) => (
        <Form className={CLASS_NAME}>
          <div className={`${CLASS_NAME}__header`}>
            Create a new {gitOrganization.provider} repository to sync your
            resource with
          </div>

          {gitOrganization.useGroupingForRepositories && (
            <>
              <div className={`${CLASS_NAME}__label`}>Change workspace</div>
              <GitSelectMenu
                gitProvider={gitOrganization.provider}
                selectedItem={repositoryGroup}
                items={gitGroups}
                onSelect={setRepositoryGroup}
              />
            </>
          )}

          <div>
            <Toggle
              name="isPublic"
              label="Public Repository"
              checked={values.isPublic}
              onChange={handleChange}
            />
          </div>

          <div className={`${CLASS_NAME}__label`}>Repository name</div>
          <TextField
            autoFocus
            name="name"
            autoComplete="off"
            showError={false}
          />

          {!!values.name && values.name.length > 1 && (
            <div className={`${CLASS_NAME}__info`}>
              <p className={`${CLASS_NAME}__info__emphasis`}>
                {"Your new repository will be created as "}{" "}
                <b>{processGitRepositoryName(values.name)}.</b>
              </p>
              {
                "The repository name can only contain ASCII letters, digits, and the characters ., -, and _."
              }
            </div>
          )}

          <HorizontalRule />

          <Button
            type="submit"
            className={`${CLASS_NAME}__button`}
            disabled={repoCreated.isRepoCreateLoading}
          >
            {repoCreated.isRepoCreateLoading ? (
              <CircularProgress
                className={`${CLASS_NAME}__progress`}
                centerToParent
              />
            ) : (
              "Create new repository"
            )}
          </Button>
          <Label
            text={
              formError.name || formatError(repoCreated.RepoCreatedError) || ""
            }
            type="error"
          />
        </Form>
      )}
    </Formik>
  );
}
