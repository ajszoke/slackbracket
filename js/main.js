var teamData;

function allowDrop(ev) {
	ev.preventDefault();
}

function teamIsDraggingEvent(ev) {
	var tid = ev.target.id;
	ev.dataTransfer.setData("Text", tid);
	var team = findTeamById(parseInt(tid.substring(5)))[0];
	
	var dragFromRd = $(ev.target).parents().eq(2).attr('class').substring(12);
	if (dragFromRd == "") {
		dragFromRd = 5;
	}
	onTeamDrag(team, parseInt(dragFromRd));
}

function anyDrop(ev) {
	ev.preventDefault();
	var data = $(ev.currentTarget).attr('id');
	var team = findTeamById(parseInt(data.substring(5)))[0]; // chop the team id out of the div name
	
	onTeamDropped(team, 0, false);
}

function validDrop(ev) {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("Text");
	var team = findTeamById(parseInt(data.substring(5)))[0]; // chop the team id out of the div name
	var target = ev.target;
	var confirmedTarget;
	var evictedTeam = "";
	
	// handle the drop depending on what the team was dropped on
	if ($(target).hasClass('team')) { // team dropped on an empty slot
		confirmedTarget = target;
	} else if ($(target).hasClass('mobile-f4-pick')) {
		confirmedTarget = target;
		var evictedTeam = findTeamById(parseInt($(target).attr('class').substring(5)))[0];
	} else if (($(target).hasClass('mobile-f4-label')) ||
			($(target).hasClass('mobile-f4-icon'))) {
		confirmedTarget = target.parentNode;
		var evictedTeam = findTeamById(parseInt($(target).attr('class').substring(5)))[0];
	} else if ($(target).hasClass('teamObj')) { // team dropped on an occupied slot
		confirmedTarget = target.parentNode;
		var evictedTeam = findTeamById(parseInt($(target).attr('class').substring(5)))[0];
	} else if ($(target).hasClass('teamName')) {
		confirmedTarget = target.parentNode.parentNode;
		var evictedTeam = findTeamById(parseInt($(target.parentNode).attr('class').substring(5)))[0];
	} else if ($(target).hasClass('fa-trophy')) { // team picked as tourney winner
		confirmedTarget = target;
	} else {
		console.log('Invalid drop target ' + $(target));
		droppedOnRd = "0";
	}
	
	// find the chosen round
	if (confirmedTarget.className.includes('mobile-f4')) {
		confirmedTarget.appendChild(document.getElementById(data));
		onTeamDropped(team, 5, true);
		return;
	}
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
	onTeamDropped(team, parseInt(droppedOnRd), true);
}

function clearTeamForward(team, fromRd) {
	var curSlot;
	var slots = findPossibleForwardSlots(team);
	
	for (var i = fromRd; i <= 7; i++) {
		var curCoord = slots[i - 2];
		if (i <= 4) {
			curSlot = '#' + team.team_region + ' .round.round-' + i + ' ul.matchup:nth-of-type(' + curCoord[0]
					+ ') li.team.team-' + topOrBottom(curCoord[1]);
		} else if (i === 5) {
			curSlot = '.champion .semis-' + curCoord[0] + ' li.team.team-' + topOrBottom(curCoord[1]);
			$('#' + team.team_region + ' .mobile-f4-pick')
				.empty()
				.removeClass('set')
				.addClass('unset')
				.append('<span class="mobile-f4-label">Final Four</span><div class="mobile-f4-icon"></div>')
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
	for (var i = 1; i <= 4; i++) { // generate winners through final 4
		var numMatches = Math.pow(2, (4 - i));
		$('.round-' + i + ' ul.matchup').each(function(index, element) {
			// first, look forward and make sure the next round slot is unset
			var region = $(element).parents().eq(1).attr('id');
			var winnerCoord = findNextRdSlot((index % numMatches) + 1);
			var winnerSlot;
			if (i < 4) {
				winnerSlot = '#' + region + ' .round-' + (i + 1) + ' ul.matchup:nth-of-type(' + winnerCoord[0] + ') li.team.team-'
					+ topOrBottom(winnerCoord[1]);
				advanceAutoWinner(winnerSlot, element);
			} else if (i === 4) {
				var leftOrRight, topOrBot;
				if (region === "East" || region == "West") {
					leftOrRight = 'l';
				} else {
					leftOrRight = 'r';
				}
				if (region === "East" || region === "South") {
					topOrBot = "top";
				} else {
					topOrBot = "bottom";
				}
				winnerSlot = '.champion .semis-' + leftOrRight + ' li.team.team-' + topOrBot;
				advanceAutoWinner(winnerSlot, element);
			}
		});
	}
	
	// generate final 4 winners
	$('ul.matchup.round-5').each(function(index, element){
		winnerSlot = '.final ul.championship li.team.team-' + topOrBottom(index);
		advanceAutoWinner(winnerSlot, element);
	});
	
	// generate champion
	winnerSlot = '.fa.fa-trophy';
	advanceAutoWinner(winnerSlot, 'ul.matchup.round-6');
}

function advanceAutoWinner(winnerSlot, element) {
	if ($(winnerSlot).hasClass('unset')) {
		$(winnerSlot).empty();
		var teamTop = findTeamById(parseInt($(element).find('li.team-top .teamObj').attr('id').substring(5)))[0];
		var teamBottom = findTeamById(parseInt($(element).find('li.team-bottom .teamObj').attr('id').substring(5)))[0];
		var winner = generateWinner(teamTop, teamBottom);
		$(element).find('li.team-' + winner + ' .teamObj').clone().appendTo($(winnerSlot));
		
		if($(winnerSlot).parent().hasClass('round-5')) {
			var team = findTeamById(parseInt($(element).find('li.team-' + winner + ' .teamObj').attr('id').substring(5)))[0];
			$('#' + team.team_region + ' .mobile-f4-pick')
				.empty()
				.append('<span class="mobile-f4-label">Final Four</span>')
				.append(teamToDiv(team));
				
		}
	}
}

function generateWinner(topTeam, bottomTeam) {
	var y = topTeam.team_rating - bottomTeam.team_rating;
	
	// below equation found by fitting a team's 538 expected win curve to their 538 rating difference with their opponent
	var topWinProb = .00000275096 * (4.6415888 * Math.pow((62961.779 * Math.sqrt(991046400750000 * Math.pow(y, 2)
			+ 216640010213000 * y + 4075535163691823) + 1982092801500 * y + 216640010213), (1/3)) - 1172263010
			/ Math.pow((62961.779 * Math.sqrt(991046400750000 * Math.pow(y, 2) + 216640010213000 * y + 4075535163691823)
			+ 1982092801500 * y + 216640010213), (1/3)) + 179120);
	if (topWinProb > Math.random()) {
		return "top";
	} else {
		return "bottom";
	}
}

function replacePlayInWithPseudoTeams() {
	var counter = -1;
	var playinTeams = $.grep(teamData, function(team) {
		return team.playin_flag === 1;
	});
	while (playinTeams.length > 0) {
		var t1 = playinTeams[0];
		var seedNo = t1.team_seed.slice(0, 2);
		var t2 = $.grep(playinTeams.slice(1), function (team) {
			return (seedNo === team.team_seed.slice(0, 2) && t1.team_region === team.team_region);
		})[0];
		var combTeam = {
			gender: "mens",
			forecast_date: t1.forecast_date,
			playin_flag: 0,
			team_alive: 1, // TODO: update
			team_id: counter--,
			team_name: t1.team_region + seedNo,
			team_rating: (t1.team_rating * t1.rd1_win) + (t2.team_rating * t2.rd1_win), // weight combined rating by round 1 win chance
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

function replaceOversizedTeamNames() {
	var dict = {
		"East16": "NCCU/NDST",
		"Virginia Commonwealth": "VCU",
		"Central Florida": "Cen. Florida",
		"Mississippi State": "Miss. State",
		"East11": "BEL/TEM",
		"Louisiana State": "Louisiana St.",
		"Michigan State": "Michigan St.",
		"West16": "FDU/PV",
		"West11": "SJU/ASU",
		"Northern Kentucky": "N. Kentucky",
		"Saint Mary's (CA)": "Saint Mary's",
		"North Carolina": "UNC",
		"New Mexico State": "NM State",
		"Abilene Christian": "Abilene Chr."
	};
	
	for (var longName in dict) {
		var foundTeam = $.grep(teamData, function(team) {
			return team.team_name === longName;
		})[0];
		foundTeam.team_name = dict[longName];
	}
}

function teamToDiv(team) {
	return ('<div class="teamObj" id="team_' + team.team_id
			+ '" draggable="true" ondragstart="teamIsDraggingEvent(event)" ondragend="anyDrop(event)"><span class="teamName">' + team.team_name + '</span><span class="seed">'
			+ team.team_seed + '</span></div>');
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
		case "East":
			res.push(['l', 0]);
			res.push(0);
			break;
		case "South":
			res.push(['r', 0]);
			res.push(0);
			break;
		case "West":
			res.push(['l', 1]);
			res.push(1);
			break;
		case "Midwest":
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
	console.log('click');
}

function findNextRdSlot(curRdNth) {
	var tob = (curRdNth - 1) % 2;
	var nextRdNth = Math.ceil(curRdNth/2);
	return [nextRdNth, tob];
}

function onTeamDropped(team, toRd, validDrop) {
	var rd2Onward = findPossibleForwardSlots(team);
	var slots = [convertSeedToCoordinate(team.team_seed)].concat(rd2Onward);
	
	for (var i = 1; i <= 7; i++) {
		var curSlot = slots[i - 1];
		console.log(curSlot);
		var oldClass;
		if (i <= 4) {
			oldClass = '#' + team.team_region + ' .round.round-' + i + ' ul.matchup:nth-of-type(' + curSlot[0]
					+ ') li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 5) {
			oldClass = '.champion .semis-' + curSlot[0] + ' li.team.team-' + topOrBottom(curSlot[1]);
			$('#' + team.team_region + ' .mobile-f4-pick')
				.removeClass('receptive')
				.removeAttr('ondrop, ondragover');
		} else if (i === 6) {
			oldClass = '.final ul.championship li.team.team-' + topOrBottom(curSlot);
		} else if (i === 7) {
			oldClass = '.fa.fa-trophy';
		}
		
		$(oldClass)
			.removeClass('receptive')
			.removeAttr('ondrop, ondragover');
		if (i <= toRd && validDrop) {
			$(oldClass)
				.empty()
				.removeClass('unset')
				.addClass('set')
				.append(teamToDiv(team));
			if (i === 5) {
				$('#' + team.team_region + ' .mobile-f4-pick')
					.empty()
					.removeClass('unset')
					.addClass('set')
					.append('<span class="mobile-f4-label">Final Four</span>')
					.append(teamToDiv(team));
			}
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
			oldClass = '#' + team.team_region + ' .round.round-' + (i + 2) + ' ul.matchup:nth-of-type(' + curSlot[0]
					+ ') li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 3) {
			oldClass = '.champion .semis-' + curSlot[0] + ' li.team.team-' + topOrBottom(curSlot[1]);
			makeSlotReceptive('#' + team.team_region + ' .mobile-f4-pick');
		} else if (i === 4) {
			oldClass = '.final .championship li.team.team-' + topOrBottom(curSlot);
		}
		makeSlotReceptive(oldClass);
	}
	makeSlotReceptive('.fa.fa-trophy');
}

function makeSlotReceptive(slot) {
	$(slot)
		.attr({
				ondrop: 'validDrop(event)',
				ondragenter: 'event.preventDefault()',
				ondragover: 'allowDrop(event)'
		})
		.addClass('receptive');
}

function populateBracket() {
	teamData.forEach(function (team) {
		var coord = convertSeedToCoordinate(team.team_seed);
		var slot = '#' + team.team_region + ' .round-1 ul.matchup:nth-of-type(' + coord[0] + ') .team-'
				+ topOrBottom(coord[1]);
		$(slot).html(teamToDiv(team));
		var test = $(slot).parents().eq(1).attr('class');
		var teamDiv = slot + " #team_" + team.team_id;
		$(teamDiv)
			.click(function() {
				onTeamClicked(team, 1);
			});
	});
}

function sticktothetop() {
    var window_top = $(window).scrollTop();
    var top = $('#gen-anchor').offset().top;
    if (window_top > top) {
        $('#gen-btn-wrapper').addClass('stick');
        $('#gen-anchor').height($('#gen-btn-wrapper').outerHeight());
    } else {
        $('#gen-btn-wrapper').removeClass('stick');
        $('#gen-anchor').height(0);
    }
}

$(document).ready(function() {
	
	$(function() {
		$(window).scroll(sticktothetop);
		window.addEventListener( 'touchmove', function() {});
		sticktothetop();
		Papa.parse("https://projects.fivethirtyeight.com/march-madness-api/2019/fivethirtyeight_ncaa_forecasts.csv", {
			delimiter: ",",
			download: true,
			header: true,
			dynamicTyping: true,
			skipEmptyLines: "greedy",
			complete: function(results) {
				results.data = $.grep(results.data, function(line) {
					return line.gender === 'mens' && line.forecast_date === '2019-03-17';
				});
				console.log(results);
				teamData = results.data;
				replacePlayInWithPseudoTeams();
				replaceOversizedTeamNames();
				populateBracket();
			}
		});
	});
});