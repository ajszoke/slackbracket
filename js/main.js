var teamData;

function allowDrop(ev) {
	ev.preventDefault();
}

function teamIsDraggingEvent(ev) {
	var tid = ev.target.id;
	ev.dataTransfer.setData("Text", tid);
	var team = findTeamById(parseInt(tid.substring(5)))[0];
	
	var dragFromRd = $(ev.target).parents().eq(2).attr('class').substring(12);
	onTeamDrag(team, parseInt(dragFromRd));
}

function drop(ev) {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("Text");
	var team = findTeamById(parseInt(data.substring(5)))[0]; // chop the team id out of the div name
	var confirmedTarget;
	var evictedTeam = "";
	
	// handle the drop depending on what the team was dropped on
	if ($(ev.target).hasClass('team')) { // team dropped on an empty slot
		confirmedTarget = ev.target;
	} else if ($(ev.target).hasClass('teamObj')) { // team dropped on an occupied slot
		confirmedTarget = ev.target.parentNode;
		var evictedTeam = findTeamById(parseInt($(ev.target).attr('class').substring(5)))[0];
	} else if ($(ev.target).hasClass('fa-trophy')) { // team picked as tourney winner
		confirmedTarget = ev.target;
	} else {
			console.log('Invalid drop target ' + $(ev.target));
			droppedOnRd = "0";
		}
	
	// find the chosen round, check for first four rounds first
	var droppedOnRd = $(confirmedTarget).parents().eq(1).attr('class').substring(12);
	if (droppedOnRd === "") { // user dropped on final 4 or champ round
		droppedOnRd = $(confirmedTarget).parent().attr('class').substring(27);
	}
	if (droppedOnRd === "") { // check if user dropped on trophy
		if ($(confirmedTarget).hasClass('fa-trophy')) {
			droppedOnRd = "7";
		} 
	}
	
	if (evictedTeam != "") {
		clearTeamForward(team, droppedOnRd);
	}
	
	confirmedTarget.appendChild(document.getElementById(data));
	onTeamDropped(team, parseInt(droppedOnRd));
}

function clearTeamForward(team, fromRd) {
	var curSlot;
	var slots = findPossibleForwardSlots(team);
	
	for (var i = fromRd; i <= 7; i++) {
		var curCoord = slots[i - 2];
		if (i <= 4) {
			curSlot = '#' + team.team_region + ' .round.round-' + i + ' ul.matchup:nth-of-type(' + curCoord[0] + ') li.team.team-' + topOrBottom(curCoord[1]);
		} else if (i === 5) {
			curSlot = '.champion .semis-' + curCoord[0] + ' li.team.team-' + topOrBottom(curCoord[1]);
		} else if (i === 6) {
			curSlot = '.final ul.championship li.team.team-' + topOrBottom(curCoord);
		} else if (i === 7) {
			curSlot = '.fa.fa-trophy';
		}
		
		if ($(curSlot).children('#team_' + team.team_id) != null) {
			$(curSlot)
				.empty()
				.removeClass('set receptive')
				.addClass('unset');
		} else {
			break;
		}
		
	}
}

function onGenerate() {
	
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
	return ('<div class="teamObj" id="team_' + team.team_id + '" draggable="true" ondragstart="teamIsDraggingEvent(event)">' + team.team_name + '<span class="seed">' + team.team_seed + '</span></div>');
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
	var tob;
	var res = [];
	
	// handle the regional rounds first
	for (var i = 2; i <= 4; i++) {
		var nextRdPos = findNextRdSlot(curRdNth);
		curRdNth = nextRdPos[0];
		res.push(nextRdPos);
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
	
}

function findNextRdSlot(curRdNth) {
	var tob = (curRdNth - 1) % 2;
	var nextRdNth = Math.ceil(curRdNth/2);
	return [nextRdNth, tob];
}

function onTeamDropped(team, toRd) {
	var rd2Onward = findPossibleForwardSlots(team);
	var slots = [convertSeedToCoordinate(team.team_seed)].concat(rd2Onward);
	
	for (var i = 1; i <= 7; i++) {
		var curSlot = slots[i - 1];
		console.log(curSlot);
		var oldClass, newClass;
		if (i <= 4) {
			oldClass = '#' + team.team_region + ' .round.round-' + i + ' ul.matchup:nth-of-type(' + curSlot[0] + ') li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 5) {
			oldClass = '.champion .semis-' + curSlot[0] + ' li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 6) {
			oldClass = '.final ul.championship li.team.team-' + topOrBottom(curSlot);
		} else if (i === 7) {
			oldClass = '.fa.fa-trophy';
		}
		
		$(oldClass)
			.removeClass('receptive')
			.removeAttr('ondrop, ondragover');
		if (i <= toRd) {
			$(oldClass)
				.empty()
				.removeClass('unset')
				.addClass('set')
				.attr('class', newClass)
				.append(teamToDiv(team));
		}
	}
}

function onTeamDrag(team, fromRd) {
	var slots = findPossibleForwardSlots(team);
	var curRd = fromRd + 1;
	var oldClass;
	
	for (var i = fromRd - 1; i <= 4; i++) {
		var curSlot = slots[i];
		if (i <= 2) {
			oldClass = '#' + team.team_region + ' .round.round-' + (i + 2) + ' ul.matchup:nth-of-type(' + curSlot[0] + ') li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 3) {
			oldClass = '.champion .semis-' + curSlot[0] + ' li.team.team-' + topOrBottom(curSlot[1]);
			$('#' + team.team_region + ' .mobile-f4-pick')
				.attr({
					ondrop: 'drop(event)',
					ondragover: 'allowDrop(event)'
				})
				.addClass('receptive');
		} else if (i === 4) {
			oldClass = '.final .championship li.team.team-' + topOrBottom(curSlot);
		}
		$(oldClass)
			.attr({
				ondrop: 'drop(event)',
				ondragover: 'allowDrop(event)'
			})
			.addClass('receptive');
	}
	$('.fa.fa-trophy')
		.attr({
			ondrop: 'drop(event)',
			ondragover: 'allowDrop(event)'
		})
		.addClass('receptive');
}

function populateBracket() {
	teamData.forEach(function (team) {
		var coord = convertSeedToCoordinate(team.team_seed);
		var slot = '#' + team.team_region + ' .round-1 ul.matchup:nth-of-type(' + coord[0] + ') .team-' + topOrBottom(coord[1]);
		$(slot).html(teamToDiv(team));
		var test = $(slot).parents().eq(1).attr('class');
		var teamDiv = slot + " #team_" + team.team_id;
		$(teamDiv)
			.click(function() {
				onTeamClicked(team, 1);
			});
	});
}

$(document).ready(function() {
	
	$(function() {
		Papa.parse("https://projects.fivethirtyeight.com/march-madness-api/2018/fivethirtyeight_ncaa_forecasts.csv", {
			delimiter: ",",
			download: true,
			header: true,
			dynamicTyping: true,
			skipEmptyLines: "greedy",
			complete: function(results) {
				results.data = $.grep(results.data, function(line) {
					return line.gender === 'mens' && line.forecast_date === '2018-03-31';
				});
				console.log(results);
				teamData = results.data;
				replacePlayInWithPseudoTeams();
				populateBracket();
			}
		});
	});
});