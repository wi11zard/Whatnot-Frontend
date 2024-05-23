import React, {FC, useEffect, useState} from "react";
import {MyOBSWebsocket} from "@/app/entity/my_obs_websocket";
import {Logger} from "@/app/entity/logger";
import {Teams} from "@/app/common/teams";
import "./manage_team_component.css"

import {
    EmptyID,
    ObsItem, ObsScene,
    TeamAnimation,
    Event
} from "@/app/entity/entities";
import Image from "next/image";
import {isObsItemSet} from "@/app/utils/team_logo_utils";

interface ManageTeamProps {
    obs: MyOBSWebsocket
    logger: Logger
    animationScene: string
    animation: TeamAnimation
    scene: ObsScene
    event: Event|undefined
    initEvent: (e: Event) => void
}

function getTeamImageSrc(team: string) {
    return `/images/teams/${team}.webp`;
}

export const ManageTeamComponent: FC<ManageTeamProps> = (props) => {
    const [animated, setAnimated] = useState(false)

    useEffect(() => {
        if (animated) {
            setTimeout(() => {
                // setAnimated(false)
            }, 2500)
        }
    }, [animated]);

    function isAdvancedAnimationSet() {
        return isObsItemSet(props.animation.obsItem)
    }

    function playAnimation(item: ObsItem) {
        let team = props.animation.team;
        props.obs.showAndHideMediaSource(props.scene, item, () => {
            props.logger.add(`Team ${team} is hidden`)
            setAnimated(false)
        }).then(_ => {
            props.logger.add(`Team ${team} is showed and playing`)
            setAnimated(true)
            if (props.event) {
                props.initEvent(props.event)
            } else {
                props.logger.add(`Unable to initialize team ${team}`)
            }
        })
    }

    function playAdvancedAnimation() {
        playAnimation(props.animation.obsItem)
    }

    return <div className='border border-1 p-2 w-50p overflow-hidden w-100p h-100p'>
        <span>
            <Image src={getTeamImageSrc(props.animation.team)} alt={props.animation.team} height="30" width="30"/>
        </span>
        {props.animation.team.split(' ').slice(-1)}
        <div className='fs-5 text-green'>{animated ? 'Animated!' : ''}</div>
        <div className='d-flex gap-2'>
            {
                props.event?.customer == ''
                    ? isAdvancedAnimationSet() && <button className='btn btn-primary' disabled={animated} onClick={playAdvancedAnimation}>Advanced</button>
                    : <div className='text-red'>Team is taken</div>
            }
        </div>
    </div>
}