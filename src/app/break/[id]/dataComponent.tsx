import {FC} from "react";
import {Event} from "@/app/entity/entities";
import {filterOnlyTakenTeams} from "@/app/common/event_filter";
import {Teams} from "@/app/common/teams";

interface DataProps {
    events: Event[]
    highBidTeam: string
    giveawayTeam: string
}

export const DataComponent: FC<DataProps> = (props) => {
    let takenTeams = filterOnlyTakenTeams(props.events)

    function getHighestBid() {
        return takenTeams.reduce((acc, i) => i.price > acc ? i.price : acc, 0)
    }

    function getAverageBid() {
        let validTeamsAmount = getValidTeamsAmount()
        return Math.round(takenTeams.reduce((acc, i) => acc + i.price, 0) / validTeamsAmount)
    }

    function getTotal() {
        return takenTeams.reduce((acc, i) => acc + i.price, 0)
    }

    function getValidTeamsAmount() {
        let validTeamsAmount = takenTeams.length
        if (takenTeams.find(i => i.team == props.giveawayTeam && i.customer != '')) {
            validTeamsAmount--
        }
        if (takenTeams.find(i => i.team == props.highBidTeam && i.customer != '')) {
            validTeamsAmount--
        }
        return validTeamsAmount
    }

    return <div className='border border-primary rounded rounded-3 border-1'>
        {takenTeams.length > 0 && <div className='border border-1 p-1'>Highest bid: <div><b className='fs-1'>{getHighestBid()} $</b></div></div>}
        {takenTeams.length > 0 && <div className='border border-1 p-1'>Average bid for <b className='fs-5'>{getValidTeamsAmount()}</b> teams: <div><b className='fs-1'>{getAverageBid()} $</b></div></div>}
        {takenTeams.length > 0 && <div className='border border-1 p-1'>Total: <div><b className='fs-1'>{getTotal()} $</b></div></div>}
    </div>
}