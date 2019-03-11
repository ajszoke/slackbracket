var teamData;

function allowDrop(ev) {
	ev.preventDefault();
}

function teamIsDraggingEvent(ev) {
	ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("text");
	console.log(data);
	ev.target.appendChild(document.getElementById(data));
}

function assignTeamToMatchup(team, matchup) {
	
}

function makeBackwardSlotsReceptive(input) {
	
}

function generateWinner(topTeam, bottomTeam) {
	
}

function onMobileF4Assign(input) {
	
}

function replacePlayInWithPseudoTeams() {
	var playinTeams = $.grep(teamData, function(team) {
		return team.playin_flag === 1;
	});
	while (playinTeams.length > 0) {
		var t1 = playinTeams[0];
		var seedNo = t1.team_seed.slice(0, 2);
		var t2 = $.grep(playinTeams.slice(1), function (team) {
			return (seedNo === team.team_seed.slice(0, 2) && t1.team_region === team.team_region);
		});
		var combTeam = {
			gender: "mens",
			forecast_date: t1.forecast_date,
			playin_flag: 0,
			team_alive: 1, // TODO: update
			team_id: t1.team_region + seedNo,
			team_name: t1.team_region + seedNo, // TODO fix
			team_rating: 0, // TODO
			team_region: t1.team_region,
			team_seed: parseInt(seedNo)
		};
		teamData.push(combTeam);
		playinTeams.shift();
		playinTeams = $.grep(playinTeams, function(team) {
			return (team != t2);
		});
	}
	teamData = $.grep(teamData, function(team) {
		return team.playin_flag != 1;
	});
}

function teamToDiv(team) {
	return ('<div id="team_' + team.team_id + '" draggable="true" ondrag="teamIsDraggingEvent(event)">' + team.team_name + '<span class="seed">' + team.team_seed + '</span></div>');
}

function topOrBottom(sel) {
	switch(sel) {
		case 0:
			return 'top';
		case 1:
			return 'bottom';
		default:
			return null;
	}
}

function convertSeedToCoordinate(seed) {
	switch(seed) {
		case 1:
			return [1, 0];
		case 2:
			return [8, 0];
		case 3:
			return [6, 0];
		case 4:
			return [4, 0];
		case 5:
			return [3, 0];
		case 6:
			return [5, 0];
		case 7:
			return [7, 0];
		case 8:
			return [2, 0];
		case 9:
			return [2, 1];
		case 10:
			return [7, 1];
		case 11:
			return [5, 1];
		case 12:
			return [3, 1];
		case 13:
			return [4, 1];
		case 14:
			return [6, 1];
		case 15:
			return [8, 1];
		case 16:
			return [1, 1];
		default:
			console.log("Error converting seed " + seed + " to round 1 coordinate!");
			return;
	}
}

function findPossibleForwardSlots(team) {
	var r1Coord = convertSeedToCoordinate(team.team_seed);
	var curRdNth = r1Coord[0];
	var tob = r1Coord[1];
	var res = [];
	
	// handle the regional rounds first
	for (var i = 2; i <= 4; i++) {
		tob = (curRdNth - 1) % 2;
		curRdNth = Math.ceil(curRdNth/2);
		res.push([curRdNth, tob]);
	}
	
	// handle the final 4 and champ rounds separately
	switch (team.team_region) {
		case "Midwest":
			res.push(['l', 0]);
			res.push(0);
			break;
		case "East":
			res.push(['l', 1]);
			res.push(0);
			break;
		case "West":
			res.push(['r', 0]);
			res.push(1);
			break;
		case "South":
			res.push(['r', 1]);
			res.push(1);
			break;
		default:
			console.log("Error determining region for team " + team.team_id);
			return;
	}
	return res;
}

function findTeamById(id) {
	return $.grep(teamData, function(team) {
		return team.team_id === id;
	});
}

function onTeamClicked(team, roundNo) {
	alert(team.team_id + " " + roundNo);
}

function onTeamMouseUp(team, roundNo) {
	console.log(team.team_id + " mouseup");
}

function makeForwardSlotsReceptive(team, roundNo) {
	var slots = findPossibleForwardSlots(team);
	var curRd = roundNo + 1;
	
	for (var i = roundNo - 1; i <= 4; i++) {
		var curSlot = slots[i];
		var newClass = 'team team-' + topOrBottom(curSlot[1]) + ' receptive';
		if (i <= 2) {
			var oldClass = '#' + team.team_region + ' .round.round-' + (i + 2) + ' ul.matchup:nth-of-type(' + curSlot[0] + ') li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 3) {
			var oldClass = '.champion .semis-' + curSlot[0] + ' li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 4) {
			var oldClass = '.final .championship li.team.team-' + topOrBottom(curSlot);
		}
		$(oldClass).attr('class', newClass);
	}
	//$('i.fa.fa-trophy').attr('class', 'i.fa.fa-trophy.receptive');
}

function populateBracket() {
	teamData.forEach(function (team) {
		var coord = convertSeedToCoordinate(team.team_seed);
		var slot = '#' + team.team_region + ' .round-1 ul.matchup:nth-of-type(' + coord[0] + ') .team-' + topOrBottom(coord[1]);
		$(slot).html(teamToDiv(team));
		var teamDiv = slot + " #team_" + team.team_id;
		$(teamDiv)
			.mousedown(function() {
				makeForwardSlotsReceptive(team, 1);
			})
			.mouseup(function() {
				onTeamMouseUp(team, 1);
			})
			.click(function() {
				onTeamClicked(team, 1);
			});
	});
}

$(document).ready(function() {
	
	$(function() {
		Papa.parse("https://projects.fivethirtyeight.com/march-madness-api/2019/fivethirtyeight_ncaa_forecasts.csv", {
			delimiter: ",",
			download: true,
			header: true,
			dynamicTyping: true,
			skipEmptyLines: "greedy",
			complete: function(results) {
				console.log(results);
				teamData = results.data;
				replacePlayInWithPseudoTeams();
				populateBracket();
			}
		});
	});
});