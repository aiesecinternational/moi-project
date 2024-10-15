import {gql} from "@apollo/client";
import {runQuery} from "@/utils/graphql-utils";
import {forceGetPersonId, getAccessibleEntities, isAiEbMember} from "@/utils/person-utils";
import {prisma} from "@/utils/prisma-utils";

async function getApplicationOwnerId(applicationId: number): Promise<number> {
    const application = await prisma.surveyResponse.findUnique({
        where: {
            applicationId: applicationId
        },
        select: {
            ownerId: true
        }
    });

    if (application) {
        const ownerId = application.ownerId;
        if (ownerId != -1) return ownerId;
    }

    const query = gql`
        query GetApplicationData {
            getApplication(id: "${applicationId}") {
                person {
                    id
                }
            }
        }
    `

    const queryResponse = await runQuery(query);

    const ownerId = queryResponse.getApplication.person.id;
    try {
        await prisma.surveyResponse.update({
            where: {
                applicationId: applicationId
            },
            data: {
                ownerId: parseInt(ownerId)
            }
        });
    } catch (e) {
        console.error("Unable to update application owner ID:", e);
    }

    return ownerId;
}

async function getApplicationOffice(applicationId: number): Promise<number> {
    const application = await prisma.surveyResponse.findUnique({
        where: {
            applicationId: applicationId
        },
        select: {
            slot: {
                select: {
                    opportunity: {
                        select: {
                            officeId: true
                        }
                    }
                }
            }
        }
    });

    if (application) {
        const officeId = application.slot.opportunity.officeId;
        if (officeId != -1) return officeId;
    }

    const query = gql`
        {
            getApplication(id: "${applicationId}") {
                opportunity {
                    id
                }
                host_lc {
                    id
                }
            }
        }
    `

    const queryResponse = await runQuery(query);

    try {
        await prisma.opportunity.update({
            where: {
                id: parseInt(queryResponse.getApplication.opportunity.id)
            },
            data: {
                officeId: parseInt(queryResponse.getApplication.host_lc.id)
            }
        });
    } catch (e) {
        console.error("Unable to update opportunity office ID:", e);
    }

    return parseInt(queryResponse.getApplication.host_lc.id);
}


export async function getApplicationOwner(applicationId: number): Promise<{
    id: number,
    name: string,
    photo: string,
}> {
    const query = gql`
        {
            getApplication(id: "${applicationId}") {
                person {
                    id
                    first_name
                    last_name
                    profile_photo
                }
            }
        }
    `

    const queryResponse = await runQuery(query);
    return {
        id: queryResponse.getApplication.person.id,
        name: queryResponse.getApplication.person.first_name + " " + queryResponse.getApplication.person.last_name,
        photo: queryResponse.getApplication.person.profile_photo
    };
}

export async function verifyCanSubmitQuestionnaire(applicationId: number) {
    const personId = await forceGetPersonId();
    const applicationOwner = await getApplicationOwnerId(applicationId);
    if (personId === applicationOwner) return;

    if (await isAiEbMember()) return;

    throw new Error("Not authorized");
}

export async function verifyCanViewQuestionnaire(applicationId: number) {
    const personId = await forceGetPersonId();
    const applicationOwner = await getApplicationOwnerId(applicationId);
    if (personId === applicationOwner) return;
    
    const accessibleEntities = await getAccessibleEntities();
    const applicationOffice = await getApplicationOffice(applicationId);

    if (accessibleEntities.includes(applicationOffice)) return;
    else throw new Error("Not authorized");
}