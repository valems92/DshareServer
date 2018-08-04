'use strict';

const
    axios = require('axios'),
    schedule = require('node-schedule');

const
    APP_ID = "579fdea6",
    APP_KEY = "1eaa8f62ff8400e4871b7ed7a49de045";

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

                checkIfArrivalTimeChanged(search, searchLeavingTime, matches, matchesLeavingTime);
            }
        }
    });

    // TODO: Create map of matching searches that al least one search contains flightId
    // TODO: For each entity in map
    // TODO:    check if flights arrival time has changed
    // TODO:        If still a match
    // TODO:            Notify both searches on the change
    // TODO:        else
    // TODO:            Notify both searches on the change
    // TODO:            Set searches (foundSuggestion = false)

}

function removeOldSearches() {

}

function checkIfArrivalTimeChanged(search, searchLeavingTime, matches, matchesLeavingTime) {
    // Search arrival time changed
    if (searchLeavingTime != search.leavingTime) {
        matchesLeavingTime.forEach(async function (matchLeavingTime) {

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