'use client'

import React, {createRef, Dispatch, SetStateAction, useEffect, useRef, useState} from "react";
import {getEndpoints, post} from "@/app/lib/backend";
import {TuiDateTimePicker} from "nextjs-tui-date-picker";
import moment, {max} from "moment";
import {Day, Break, Event, SelectedBreak, GetStreamUsernamesResponse} from "@/app/entity/entities";
import {EventComponent} from "@/app/break/[id]/eventComponent";
import {useRouter} from "next/navigation";
import GiveawayComponent from "@/app/break/[id]/giveawayComponent";
import TextInput from "@/app/common/textInput";
import EventPlaceholderComponent from "@/app/break/[id]/eventPlaceholderComponent";
import './breakComponent.css'
import TeamsListComponent from "@/app/break/[id]/teamsListComponent";
import ToolsComponent from "@/app/break/[id]/toolsComponent";
import {
    sortByIndexAscTeamAsc,
    sortByIndexDescTeamAsc,
    sortByTeamAscIndexDesc,
    sortByTeamName
} from "@/app/common/event_filter";
import EventPlaceholdersComponent from "@/app/break/[id]/eventPlaceholdersComponent";
import {ToolsTabComponent} from "@/app/break/[id]/toolsTabComponent";
import {arrayUnique, sortStringsAlphabetically} from "@/app/common/helpers";

const SortIndexAsc = 0
const SortIndexDesc = 1
const SortTeamFirst = 2

interface BreakComponentProps {
    breakObject: Break
}

export const BreakComponent: React.FC<BreakComponentProps> = (params) => {
    const [events, setEvents] = useState<Event[]>([])
    const [giveaways, setGiveaways] = useState<Event[]>([])
    const [newGiveawayCustomer, setNewGiveawayCustomer] = useState("")
    const [toDemo, setToDemo] = useState(false)
    let emptyEvent: Event = {
        break_id: 0, customer: "", id: 0, index: 0, is_giveaway: false, note: "", price: 0, quantity: 0, team: ""
    }
    const [eventPlaceholder, setEventPlaceholder] = useState<Event>({...emptyEvent})
    const [sortDir, setSortDir] = useState<number|null>(null)
    const [usernames, setUsernames] = useState<string[]>([])

    function getUsernames() {
        let body = {
            id: params.breakObject.day_id
        }
        post(getEndpoints().stream_usernames, body)
            .then((i: GetStreamUsernamesResponse) => {
                setUsernames(sortStringsAlphabetically(arrayUnique(i.usernames.filter(j => j != '').map(i => i.trim()))))
            })
    }

    useEffect(() => {
        refreshEvents()
        getUsernames()
    }, [])

    function refreshEvents() {
        let eventsBody = {
            break_id: params.breakObject.id
        };
        post(getEndpoints().break_events, eventsBody)
            .then((events: {events: Event[]}) => {
                const updatedEvents = [...events.events];
                updatedEvents.sort((a, b) => {
                    if (a.team > b.team) return 1
                    if (a.team < b.team) return -1
                    return 0
                })
                setEvents(updatedEvents.filter(e => !e.is_giveaway))
                setGiveaways(updatedEvents.filter(e => e.is_giveaway))
            })
    }

    function setEvent(event: Event) {
        setEvents((old) => {
            let newEvents = [...old]
            let index = newEvents.findIndex(e => e.id == event.id)
            newEvents[index] = event
            return newEvents
        })
    }

    function getNextIndex(event: Event) {
        let maxTakenIndex = 0
        for (let event of events) {
            if (event.customer && event.index > maxTakenIndex) {
                maxTakenIndex = event.index
            }
        }
        return maxTakenIndex + 1
    }

    function updateEvent(event: Event) {
        let oldEvent = events.find(e => e.id == event.id)
        if (!oldEvent || (
            event.customer == oldEvent.customer &&
            event.price == oldEvent.price &&
            event.team == oldEvent.team &&
            event.break_id == oldEvent.break_id &&
            event.is_giveaway == oldEvent.is_giveaway &&
            event.quantity == oldEvent.quantity &&
            event.note == oldEvent.note
        )) {
            return
        }
        let updateEventBody = {...event}
        post(getEndpoints().event_update, updateEventBody)
            .then(response => {
                if (response.success) {
                    let moveBody = {
                        id: event.id,
                        new_index: getNextIndex(event)
                    }

                    let oldEvent = events.find(e => e.id == event.id)
                    if (!oldEvent) {
                        return
                    }

                    setEvent(event)

                    if (oldEvent.customer != '') {
                        return
                    }
                    post(getEndpoints().event_move, moveBody)
                        .then(_ => {
                            event.index = moveBody.new_index
                            setEvent(event)
                        })
                }

            })
    }

    function resetEvent(event: Event) {
        let updateEventBody = {...event}
        updateEventBody.customer = ''
        post(getEndpoints().event_update, updateEventBody)
            .then(response => {
                if (response.success) {
                    let moveBody = {
                        id: event.id,
                        new_index: 33,
                    }

                    post(getEndpoints().event_move, moveBody)
                        .then(_ => {
                            refreshEvents()
                        })
                }
            })
    }

    function updateGiveaway(event: Event) {
        let updateEventBody = {...event}
        post(getEndpoints().event_update, updateEventBody)
            .then(response => {
                if (response.success) {
                    let moveBody = {
                        id: event.id,
                        new_index: getNextIndex(event)
                    }
                    setGiveaways((old) => {
                        let newGiveaway = [...old]
                        let changeEvent = newGiveaway.filter(e => e.id == event.id)
                        if (changeEvent.length > 0) {
                            changeEvent[0].customer = event.customer
                        }
                        return newGiveaway
                    })
                }

            })
    }

    function deleteGiveaway(event: Event) {
        let updateEventBody = {id: event.id}
        post(getEndpoints().event_delete, updateEventBody)
            .then(response => {
                if (response.success) {
                    setGiveaways((old) => {
                        return [...old].filter(e => e.id != event.id)
                    })
                }
            })
    }

    function updateNewGiveawayCustomer(value: string) {
        setNewGiveawayCustomer(value)
    }

    function saveNewGiveawayCustomer() {
        if (newGiveawayCustomer == '') {
            return
        }
        let event: Event = {
            id: 0,
            index: -1,
            break_id: params.breakObject.id,
            customer: newGiveawayCustomer,
            price: 0,
            team: '',
            is_giveaway: true,
            note: '',
            quantity: 1,
        }
        post(getEndpoints().event_add, event)
            .then(response => {
                event.id = response.id
                setGiveaways((old) => {
                    let newE = [...old]
                    newE.push(event)
                    return newE
                })
                setNewGiveawayCustomer('')
            })
    }

    function updateEventPlaceholder(newEvent: Event) {
        setEventPlaceholder((old) => {
            let newE = {...old}
            newE.price = newEvent.price
            newE.customer = newEvent.customer
            return newE
        })
    }

    function resetEventPlaceholder() {
        setEventPlaceholder({...emptyEvent})
    }

    function moveEvent(event: Event, newIndex: number) {
        let body = {
            id: event.id,
            new_index: newIndex,
        }
        post(getEndpoints().event_move, body)
            .then(response => {
                if (response.success) {
                    refreshEvents()
                }
            })
    }

    function getEventPlaceholder() {
        let newE = {...eventPlaceholder}
        let reset = {...newE}
        reset.customer = ''
        reset.price = 0
        setEventPlaceholder(reset)
        return newE
    }

    function isPlaceholderEmpty() {
        return eventPlaceholder.customer == ''
    }

    function swapTeams(a: Event[], b: Event[]) {
        let aCustomer = a[0].customer
        let bCustomer = b[0].customer
        let aUpdated = a.map(e => {
            let newE = {...e}
            newE.customer = bCustomer
            return newE
        })
        let bUpdated = b.map(e => {
            let newE = {...e}
            newE.customer = aCustomer
            return newE
        })


        let body = {
            events: [...aUpdated, ...bUpdated]
        }
        post(getEndpoints().event_update_all, body).then(() => {
            refreshEvents()
        })
    }

    let eventsSorted = [...events]

    if (sortDir == SortIndexAsc) {
        eventsSorted = sortByIndexAscTeamAsc(eventsSorted)
    } else if (sortDir == SortIndexDesc) {
        eventsSorted = sortByIndexDescTeamAsc(eventsSorted)
    } else if (sortDir == SortTeamFirst) {
        eventsSorted = sortByTeamAscIndexDesc(eventsSorted)
    } else {
        eventsSorted = sortByTeamName(eventsSorted)
    }

    function getNextSortDirName() {
        switch (sortDir) {
            case null:
                return 'Sort by Index Asc'
            case SortIndexAsc:
                return 'Sort by Index Desc'
            case SortIndexDesc:
                return 'Sort by Team First'
            case SortTeamFirst:
                return 'Sort by Team Alphabetical'
        }
    }

    function setNextSortDir() {
        let nextDir = null
        switch (sortDir) {
            case null:
                nextDir = SortIndexAsc
                break;
            case SortIndexAsc:
                nextDir = SortIndexDesc
                break;
            case SortIndexDesc:
                nextDir = SortTeamFirst
                break;
            case SortTeamFirst:
                nextDir = null
                break;
        }
        setSortDir(nextDir)
    }

    function addUsername(username: string) {
        setUsernames((old) => {
            if (old.indexOf(username) !== -1) {
                return old
            }
            let newU = [...old]
            newU.push(username)
            sortStringsAlphabetically(newU)
            return newU
        })
    }

    return <div className='d-flex m-2 justify-content-evenly'>
            <div className='w-75p'>
                <div className='d-flex align-items-baseline justify-content-between'>
                    <div className='fs-1'>Teams:</div>
                    <div onClick={setNextSortDir} className='text-primary cursor-pointer'>
                        {getNextSortDirName()}
                    </div>
                </div>
                <div className="d-flex flex-wrap gap-4 events-container justify-content-center">
                    {eventsSorted.map(
                        (eventObject, index, arr) => {
                            return <EventComponent key={eventObject.id}
                                event={{...eventObject}}
                                events={arr}
                                updateEvent={updateEvent}
                                resetEvent={resetEvent}
                                getEventPlaceholder={getEventPlaceholder}
                                moveEvent={moveEvent}
                                isPlaceholderEmpty={isPlaceholderEmpty}
                                usernames={usernames}
                                addUsername={addUsername}
                            />
                        }
                    )}
                </div>
            </div>
            <div className='w-15p justify-content-center'>
                <div className='border border-primary rounded rounded-3 border-1 d-flex flex-column align-items-center'>
                    <div>Giveaways:</div>
                    <div>
                        <ul className="list-group gap-1">
                            {
                                giveaways.map((giveaway, index) => {
                                    return <GiveawayComponent key={giveaway.id} params={{
                                        event: giveaway,
                                        updateEvent: updateGiveaway,
                                        resetEvent: deleteGiveaway,
                                    }}/>
                                })
                            }
                        </ul>
                        <div className='w-75p m-2'>
                            <TextInput params={{
                                value: newGiveawayCustomer,
                                update: updateNewGiveawayCustomer,
                                save: saveNewGiveawayCustomer,
                                placeholder: 'Enter nickname',
                                font_size: null,
                                max_width: 175,
                                onClick: null,
                                onBlur: null,
                            }}/>
                        </div>
                    </div>
                </div>
                <EventPlaceholdersComponent params={{
                    realEventPlaceholder: {...eventPlaceholder},
                    updateRealEventPlaceholder: updateEventPlaceholder,
                    resetRealEventPlaceholder: resetEventPlaceholder,
                    length: 4
                }}/>
                <ToolsComponent params={{events: events, swapTeams: swapTeams}}/>
            </div>
            <div className='w-15p'>
                <ToolsTabComponent events={events} changeIndex={moveEvent} streamId={params.breakObject.day_id} breakId={params.breakObject.id}/>
            </div>
    </div>
}