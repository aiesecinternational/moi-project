import {Project} from "@/types/project-types";
import {gql} from "@apollo/client";
import {runQuery} from "@/utils/graphql-utils";
import {mapProject} from "@/mappers/project-mappers";
import SlotBox from "@/components/SlotBox";
import Questionnaire from "@/components/questions/Questionnaire";
import {Suspense} from "react";
import QuestionnaireSkeleton from "@/components/questions/QuestionnaireSkeleton";
import {waitRandomTime} from "@/utils/test-utils";

type Props = {
    params: {
        id: string
    }
}

export default async function ProjectQuestionnaire(props: Props) {
    await waitRandomTime();
    const projectId = props.params.id;
    const project = await getProject(projectId);

    const today = new Date();
    const slotEndDate = new Date(project.endDate);
    const finalSectionEnabled = ((slotEndDate.getTime() - today.getTime()) < 7 * 24 * 60 * 60 * 1000)
    // const finalSectionEnabled = true;

    return (
        <div className={`flex flex-col md:flex-row md:space-x-5 pt-5 w-full space-y-10 md:space-y-0 max-w-2xl md:max-w-fit`}>
            <SlotBox project={project}/>
            <Suspense fallback={<QuestionnaireSkeleton/>}>
                <Questionnaire projectName={project.name} projectId={project.id} finalSectionEnabled={finalSectionEnabled}></Questionnaire>
            </Suspense>
        </div>
    );
}

async function getProject(projectId: string): Promise<Project> {
    const query = gql`
        query GetApplicationData {
            getApplication(id: "${projectId}") {
                id
                opportunity {
                    title
                    location
                    sdg_info {
                        sdg_target {
                            goal_index
                        }
                    }
                }
                slot {
                    start_date
                    end_date
                }
            }
        }
    `

    const queryResponse = await runQuery(query);

    const opportunityApplication = queryResponse.getApplication;
    return mapProject(opportunityApplication);
}