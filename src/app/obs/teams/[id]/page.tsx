'use client'

import {createRef, Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {getEndpoints, post} from "@/app/lib/backend";
import {TuiDateTimePicker} from "nextjs-tui-date-picker";
import moment, {max} from "moment";
import {Day, Break, Event, SelectedBreak, Demo} from "@/app/entity/entities";
import {useRouter} from "next/navigation";
import './page.css'
import EventComponent from "@/app/demo/[id]/eventComponent";
import Image from "next/image";
import {filterOnlyEmptyTeams, filterOnlyTakenTeams, getEventWithHighestPrice} from "@/app/common/event_filter";

export default function Page({params} : {params: {id: string}}) {
    const streamId = parseInt(params.id)
    const [demo, setDemo] = useState<Demo|null>(null)
    const [breakObject, setBreakObject] = useState<Break|null>(null)
    const [events, setEvents] = useState<Event[]>([])
    const demoRef = useRef<Demo|null>(null)

    function refreshBreakObject() {
        if (!demoRef || !demoRef.current) {
            return
        }
        let body = {
            id: demoRef.current.break_id
        }
        post(getEndpoints().break_get, body)
            .then((breakO: Break) => {
                setBreakObject(breakO)
            })
    }

    useEffect(() => {
        setInterval(() => {
            refreshBreakObject()
        }, 60000)
    }, []);

    const refreshDemo = useCallback(() => {
        let eventsBody = {
            stream_id: streamId
        };

        post(getEndpoints().stream_demo, eventsBody)
            .then((response: Demo) => {
                setDemo(response)
            })
    }, [params.id])

    useEffect(() => {
        refreshBreakObject()
        refreshEvents()
        demoRef.current = demo
    }, [demo]);

    useEffect(() => {
        refreshDemo()

        setInterval(() => {
            refreshEvents()
        }, 5000)
        setInterval(() => {
            refreshDemo()
        }, 1500)
    }, []);

    function demoIsSet() {
        let demo = demoRef.current
        return demo && demo.break_id;
    }

    function refreshEvents() {
        if (!demoIsSet()) {
            return
        }
        let demo = demoRef.current

        let eventsBody = { //@ts-ignore
            break_id: demo.break_id
        };

        post(getEndpoints().break_events, eventsBody)
            .then((events: {events: Event[]}) => {
                events.events.sort((a, b) => {
                    if (a.team > b.team) return 1
                    if (a.team < b.team) return -1
                    return 0
                })
                let teamEvents = events.events.filter(e => !e.is_giveaway && !e.note)
                setEvents(teamEvents)
            })
    }

    let items = []
    if (events.length > 0 && demo) {
        let rowsAmount = 16
        for (let i = 0; i < rowsAmount; i++) {
            let index = i
            let eventObject = events[index]
            let eventParams = {
                event: eventObject,
                highlight_username: demo.highlight_username,
                highBidTeam: breakObject?.high_bid_team ?? '',
                giveawayTeam: breakObject?.giveaway_team ?? ''
            }
            let colKey = `col-${index}`
            items.push(<EventComponent key={colKey} params={eventParams}/>)

            index = i + rowsAmount
            eventObject = events[index]
            eventParams = {
                event: eventObject,
                highlight_username: demo.highlight_username,
                highBidTeam: breakObject?.high_bid_team ?? '',
                giveawayTeam: breakObject?.giveaway_team ?? ''
            }
            colKey = `col-${i}-${index}`
            items.push(<EventComponent key={colKey} params={eventParams}/>)
        }
    }

    function launchFullScreen() {
        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else { // @ts-ignore
            if (elem.webkitRequestFullscreen) { // @ts-ignore
                elem.webkitRequestFullscreen(); // @ts-ignore
            }
        }
    }

    function getLeftTeamsAmount() {
        let actualEmptyTeams = filterOnlyEmptyTeams(events).length
        events.filter(i => (i.team == breakObject?.giveaway_team || i.team == breakObject?.high_bid_team) && i.customer == '')
            .forEach(i => actualEmptyTeams--)
        return Math.max(actualEmptyTeams, 0)
    }

    return (
        <div className='main'>
            <div className='w-100 h-100 dimmed-bg p-5'>
                {
                     demoIsSet() ? <div className='w-100 h-100'>
                        <div className='max-height overflow-hidden d-flex justify-content-center my-flex gap-2 teams-container'>
                            <div className='demo-container white-overlay minw'>
                                {items.length > 0 && items}
                            </div>
                        </div>
                     </div> : <div>
                         Demo is not set
                     </div>
                }
            </div>
        </div>
    )
}