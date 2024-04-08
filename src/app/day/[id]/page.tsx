'use client'

import {useEffect, useState} from "react";
import {Teams} from "@/app/common/teams";
import {get, getEndpoints, post} from "@/app/lib/backend";
import {Break, GetDaysResponse, AddBreakResponse} from "@/app/entity/entities";
import {useRouter} from "next/navigation";

export default function Page({params} : {params: {id: string}}) {
    let dayId = parseInt(params.id)
    const [breaks, setBreaks] = useState<Break[]>([])
    const [newBreakName, setNewBreakName] = useState("")
    let router = useRouter()

    useEffect(() => {
        let body = {
            day_id: dayId
        }
        post(getEndpoints().break_get_by_day, body)
            .then((breaks: Break[]) => {
                setBreaks(breaks)
            })
    }, []);

    function initNewBreak(newBreakName: string) {
        for (let team in Teams) {

        }
    }

    async function addNewBreak() {
        if (newBreakName === "") {
            return
        }

        let date = (new Date()).toISOString()
        let body = {
            day_id: dayId,
            name: newBreakName,
            start_date: date,
            end_date: date
        }

        post(getEndpoints().break_add, body)
            .then((response: AddBreakResponse) => {
                initNewBreak(newBreakName)
                setNewBreakName("")
                Teams.forEach((teamName) => {
                    let eventAddBody = {
                        break_id: response.id,
                        customer: '',
                        price: 0,
                        team: teamName,
                        is_giveaway: false,
                        note: '',
                        quantity: 0,
                    }
                    post(getEndpoints().event_add, eventAddBody)
                        .then(() => {
                            console.log(`Team ${teamName} added`)
                        })
                })
                addBreak({id: response.id, ...body})
            })
    }

    function addBreak(newBreak) {
        setBreaks((old) => {
            let newBreaks = [...old]
            newBreaks.push(newBreak)
            return newBreaks
        })
    }

    function removeBreak(index: number) {
        setBreaks((old) => {
            let newBreaks = [...old]
            newBreaks.splice(index, 1)
            return newBreaks
        })
    }

    function redirectToBreak(id: number) {
        router.push(`/break/${id}`)
    }

    return (
        <main>
            <div className="d-flex justify-content-center">
                <div className='pe-3'>
                    <button type="button" className="btn btn-primary" onClick={
                        e => {
                            let href = `/package/${dayId}`
                            router.push(href)
                        }
                    }>Package all</button>
                </div>
                <ul className="list-group">
                    {
                        breaks.map(
                            (breakObject, index, arr) => {
                                return <li key={breakObject.id} className="list-group-item text-white">
                                    <div className="container-fluid">
                                        <div className="row">
                                            <div className="col-1">{index + 1})</div>
                                            <div className="col" onClick={() => redirectToBreak(breakObject.id)}>{breakObject.name}</div>
                                            <div className="col-3">
                                                <img src="/images/bin_static_sm.png" className="img-fluid float-right" alt="" onClick={
                                                    async e => {
                                                        const body = {
                                                            id: breakObject.id,
                                                            name: breakObject,
                                                        };
                                                        post(getEndpoints().break_delete, body)
                                                            .then(response => {
                                                                removeBreak(index)
                                                            })
                                                    }
                                                }/>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            }
                        )
                    }
                    {
                        <li key="add_new" className="list-group-item">
                            <input
                                className="form-control"
                                value={newBreakName}
                                placeholder="Enter break name.."
                                onChange={e => {
                                    setNewBreakName(e.currentTarget.value)
                                }
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addNewBreak();
                                    }
                                }}
                            />
                            <div className="d-flex justify-content-end mt-2">
                                <button type="button" id="add-btn" className="btn btn-primary" onClick={async e => {addNewBreak()}}>Add</button>
                            </div>
                        </li>
                    }
                </ul>
            </div>
        </main>
    )
}