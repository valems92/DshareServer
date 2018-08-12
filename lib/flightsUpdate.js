'use strict';

const
    axios = require('axios'),
    schedule = require('node-schedule');

const
    APP_ID = "476a9eaa",
    APP_KEY = "6e1b7f377bc951faf6b82b6dc90c15f7";

let AppDao;


async function flightsUpdate() {
    let searches = await AppDao.getAllFeatureFlightSearchesThatFoundSuggestion();

    // Go through all searches
    Object.keys(searches).forEach(async function (searchId) {
        let search = searches[searchId];

        if (search.flightId) {
            let searchFlightStatus = await getFlightStatus(search.flightId);
            let searchLeavingTime = getFlightArrivalTime(search, searchFlightStatus);

            let matches = search.suggestionsId || [];
            let matchesLeavingTime = [];

            if (matches.length > 0) {
                matches.forEach(async function (match) {
                    if (match.flightId) {
                        let matchStatus = await getFlightStatus(match.flightId);
                        matchesLeavingTime.push(getFlightArrivalTime(match, matchStatus));
                    } else {
                        matchesLeavingTime.push(match.leavingTime);
                    }
                });

                checkIfArrivalTimeChanged(search,searchId, searchLeavingTime, matches, matchesLeavingTime);
            }
        }
    });
}


//remove oid Searches
async function removeOldSearches() {
    let searchesToRemove = await AppDao.getAllFeatureFlightSearchesThatFoundSuggestion();

    Object.keys(searchesToRemove).forEach(async function (searchId) {
        let search = searchesToRemove[searchId];

        if (search.flightId) {
            let searchFlightStatus = await getFlightStatus(search.flightId);
            let searchLeavingTime = getFlightArrivalTime(search, searchFlightStatus);

            if(searchLeavingTime<Date.now())
            {
                console.log("Delete flight");
                let status = AppDao.deleteSearch(searchId);
                if (status)
                    console.log("The flight is deleted");
                else
                    console.log("Error");
            }
        }
    });

}


function checkIfArrivalTimeChanged(search,searchId, searchLeavingTime, matches, matchesLeavingTime) {

    //check if flights arrival time has changed
    if (searchLeavingTime != search.leavingTime) {
        //matchesLeavingTime.forEach(async function (matchLeavingTime) {
        matches.forEach(async function (match) {
            let matchUpdatedLeavingTime = matchesLeavingTime.pop();

            //after checking the updted arrival time, If there are still a match
            if (searchLeavingTime == matchUpdatedLeavingTime) {
                AppDao.updateSearchLeavingTimeInFirebase(searchId, searchLeavingTime);
                AppDao.updateSearchLeavingTimeInFirebase(match[match], matchUpdatedLeavingTime);
            }
            //Notify both searches on the change && Set searches (foundSuggestion = false)
            else {
                search.foundSuggestion = false;
                AppDao.updateSearchLeavingTimeInFirebase(searchId, search.foundSuggestion)
                AppDao.updateSearchLeavingTimeInFirebase(searchId, searchLeavingTime);
                AppDao.updateSearchLeavingTimeInFirebase(match[match], matchUpdatedLeavingTime);
            }
        });

    }
}

function getFlightArrivalTime(search, flightStatus) {
    let leavingTime = search.leavingTime;
    if (flightStatus) {
        if (flightStatus.flightStatus &&
            flightStatus.flightStatus.operationalTimes &&
            flightStatus.flightStatus.operationalTimes.estimatedRunwayArrival &&
            flightStatus.flightStatus.operationalTimes.estimatedRunwayArrival.dateUtc) {

            return Date.parse(flightStatus.flightStatus.operationalTimes.estimatedRunwayArrival.dateUtc);

        } else {
            return leavingTime;
        }
    } else {
        return leavingTime;
    }
}

async function getFlightStatus(flightId) {
    let baseUrl = `https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/status/${flightId}?appId=${APP_ID}&appKey=/${APP_KEY}`;

    let res = null;
    try {
        res = await axios.get(baseUrl);
    } catch (err) {
        console.log('Failed to check flight ' + flightId);
    }

    return res;
}

module.exports = (admin) => {
    AppDao = admin;

    // Every hour - check for flights updates
    schedule.scheduleJob('2 * * * *', () => {
        flightsUpdate();
        removeOldSearches();
    });
};