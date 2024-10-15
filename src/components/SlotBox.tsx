import {formatDateToMonthYear} from "@/utils/datetime-utils";
import {Project} from "@/types/project-types";
import Image from 'next/image'
import Link from "next/link";
import {getProjectLogo} from "@/utils/img-utils";

type Props = {
    project: Project;
}

export default function SlotBox(props: Props) {
    return (
        <Link className={`flex flex-row h-fit w-full md:w-fit`} href={`/questionnaire/${props.project.id}`}>
            <div className={"flex flex-row bg-white rounded-md shadow-md text-gray-800 h-24 md:min-w-[400px] w-full md:w-fit"}>
                <div className={`h-96`}>
                    <Image className={`rounded-l-md`} src={getProjectLogo(props.project.name, props.project.sdg)}
                           width={96}
                           height={96}
                           priority={true}
                           alt={`Sustainable development goal for project ${props.project.name}`}
                    />
                </div>
                <div className={`flex flex-col pl-5 space-y-1 justify-center`}>
                    <div>
                        <div className={`text-2xl font-bold text-gray-700`}>{props.project.name}</div>
                        <div className={`text-xs text-gray-400`}>{props.project.location}</div>
                    </div>
                    <div className={`text-xs`}>{formatDateToMonthYear(props.project.startDate)} - {formatDateToMonthYear(props.project.endDate)}</div>
                </div>
            </div>
        </Link>
    );
}
