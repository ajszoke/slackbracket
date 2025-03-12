const REGION_1_NAME = "East"
const REGION_2_NAME = "West"
const REGION_3_NAME = "South"
const REGION_4_NAME = "Midwest"
const R64_DATE_LABEL = "March 21-22"
const R32_DATE_LABEL = "March 23-24"
const S16_DATE_LABEL = "March 28-29"
const E8_DATE_LABEL = "March 30-31"
const F4_DATE_LABEL = "April 6"
const SHIP_DATE_LABEL = "April 8"

var teamData;
var chaos = 50;
var animation_toggle = false;
var isMobile = false;
var teamAbbreviations;

var xhr = new XMLHttpRequest();

$(document).ready(function () {
	
	$(window).scroll(updateStickyElements);
	window.addEventListener('touchmove', function () { });
	updateStickyElements();
	if (window.innerWidth < 980) {
		formatMobile();
	}

	$('#region-1-label').text(REGION_1_NAME);
	$('#region-2-label').text(REGION_2_NAME);
	$('#region-3-label').text(REGION_3_NAME);
	$('#region-4-label').text(REGION_4_NAME);
	$('#region-1-tab').text(REGION_1_NAME);
	$('#region-2-tab').text(REGION_2_NAME);
	$('#region-3-tab').text(REGION_3_NAME);
	$('#region-4-tab').text(REGION_4_NAME);
	$('.r64-date-label').text(R64_DATE_LABEL)
	$('.r32-date-label').text(R32_DATE_LABEL)
	$('.s16-date-label').text(S16_DATE_LABEL)
	$('.e8-date-label').text(E8_DATE_LABEL)
	$('.f4-date-label').text(F4_DATE_LABEL)
	$('.ship-date-label').text(SHIP_DATE_LABEL)

	fetch('https://slackbracket.s3.amazonaws.com/team-abbreviations.json')
	.then(res => res.json())
	.then(json => {
		teamAbbreviations = json;
		Papa.parse("https://slackbracket.s3.amazonaws.com/2024_teams.csv", {
			delimiter: ",",
			download: true,
			header: true,
			dynamicTyping: true,
			skipEmptyLines: "greedy",
			complete: function (results) {
				console.log(results);
				teamData = results.data;
				
				// replace play-in with pseudo teams
				var playinTeams = $.grep(teamData, function (team) {
					return team.playin_flag === 1;
				});
				while (playinTeams.length > 0) {
					var t1 = playinTeams[0];
					var seedNo = t1.team_seed;
					var t2 = $.grep(playinTeams.slice(1), function (team) {
						return (seedNo === team.team_seed && t1.team_region === team.team_region);
					})[0];
					var combTeam = {
						gender: "mens",
						forecast_date: t1.forecast_date,
						playin_flag: 0,
						team_alive: 1, // TODO: update
						team_name: t1.team_region + seedNo,
						team_rating: (t1.team_rating + t2.team_rating) / 2,
						team_region: t1.team_region,
						team_seed: parseInt(seedNo)
					};
					teamData.push(combTeam);
					playinTeams.shift();
					playinTeams = $.grep(playinTeams, function (team) {
						return (team != t2);
					});
				}
				teamData = $.grep(teamData, function (team) {
					return team.playin_flag != 1;
				});


				// replace oversized team names
				var windowWidth = window.innerWidth;
				var dict;
			
				console.log(teamAbbreviations);
				if (windowWidth < 460) {
					dict = teamAbbreviations['small-abbrevs'];
				} else {
					dict = teamAbbreviations['full-abbrevs'];
				}
			
				for (var longName in dict) {
					var foundTeam = $.grep(teamData, function (team) {
						return team.team_name === longName;
					})[0];
					if (foundTeam != null) {
						foundTeam.team_name = dict[longName];
					}
				}

				// populate the bracket
				teamData.forEach(function (team) {
					team['regionLabel'] = regionNameToDivID(team.team_region);
					team['team_id'] = team.team_region + team.team_seed;
					var coord = convertSeedToCoordinate(team.team_seed);
					var slot = '#' + team.regionLabel
						+ ' .round-1 ul.matchup:nth-of-type(' + coord[0] + ') .team-' + topOrBottom(coord[1]);
					$(slot).html(teamToDiv(team));
					var teamDiv = slot + " #team_" + team.team_id;
					$(teamDiv).click(function () {
						onTeamClicked(team, 1);
					});
				});
			}
		});
	});
});

var gen_banner_height = parseInt($('#gen-btn-wrapper').css('height'), 10)
		+ parseInt($('#gen-btn-wrapper').css('padding-top'), 10)
		+ parseInt($('#gen-btn-wrapper').css('padding-bottom'), 10);

function allowDrop(ev) {
	ev.preventDefault();
}

/**
 * Captures team dragging events. Highlights the possible drop cells ahead of
 * the team's current cell and makes them receptive to recieve the drop.
 */
function teamIsDraggingEvent(ev) {
	var oldClass;
	var tid = ev.target.id;
	var team = findTeamById(tid.substring(5))[0];
	var slots = findPossibleForwardSlots(team);
	ev.dataTransfer.setData("Text", tid);

	var dragFromRd = $(ev.target).parents().eq(2).attr('class').substring(12);
	if (dragFromRd == "") {
		dragFromRd = 5;
	}
	var fromRd = parseInt(dragFromRd);

	// iterate ahead of the current round and make the target slots receptive
	for (var i = fromRd - 1; i <= 4; i++) {
		var curSlot = slots[i];
		if (i <= 2) {
			oldClass = '#' + team.regionLabel + ' .round.round-' + (i + 2)
				+ ' ul.matchup:nth-of-type(' + curSlot[0] + ') li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 3) {
			oldClass = '.champion .semis-' + curSlot[0] + ' li.team.team-' + topOrBottom(curSlot[1]);
			makeSlotReceptive('#' + team.regionLabel + ' .mobile-f4-pick');
		} else if (i === 4) {
			oldClass = '.final .championship li.team.team-' + topOrBottom(curSlot);
		}
		makeSlotReceptive(oldClass);
	}
	makeSlotReceptive('.fa.fa-trophy');
}

/**
 * Modify a given slot to have "droppable" CSS elements, and to add handling
 * for a team to be dropped onto it.
 */
function makeSlotReceptive(slot) {
	$(slot)
		.attr({
			ondrop: 'validDrop(event)',
			ondragenter: 'event.preventDefault()',
			ondragover: 'allowDrop(event)'
		})
		.addClass('receptive');
}

/**
 * Captures a mouse-release event while dragging a team that was not dropped
 * onto a valid slot.
 */
function anyDrop(ev) {
	ev.preventDefault();
	var data = $(ev.currentTarget).attr('id');
	var team = findTeamById(data.substring(5))[0]; // chop the team id out of the div name

	onTeamDropped(team, 0, false);
}

/**
 * Captures events where a team is dropped on an acceptable slot. Fills the
 * team through the path to the slot, replacing existing teams if needed.
 */
function validDrop(ev) {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("Text");
	var team = findTeamById(data.substring(5))[0]; // chop the team id out of the div name
	var target = ev.target;
	var confirmedTarget;
	var evictedTeam = "";

	// handle the drop depending on what the team was dropped on
	if ($(target).hasClass('team')) { // team dropped on an empty slot
		confirmedTarget = target;
	} else if ($(target).hasClass('mobile-f4-pick')) {
		confirmedTarget = target;
		var evictedTeam = findTeamById($(target).attr('class').substring(5))[0];
	} else if (($(target).hasClass('mobile-f4-label')) ||
		($(target).hasClass('mobile-f4-icon'))) {
		confirmedTarget = target.parentNode;
		var evictedTeam = findTeamById($(target).attr('class').substring(5))[0];
	} else if ($(target).hasClass('teamObj')) { // team dropped on an occupied slot
		confirmedTarget = target.parentNode;
		var evictedTeam = findTeamById($(target).attr('class').substring(5))[0];
	} else if ($(target).hasClass('teamName')) {
		confirmedTarget = target.parentNode.parentNode;
		var evictedTeam = findTeamById($(target.parentNode).attr('class').substring(5))[0];
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
		// team has been found occupying the target slot. Evict that team from
		// the slot, as well as all slots further down the bracket
		var curSlot;
		var slots = findPossibleForwardSlots(team);

		for (var i = droppedOnRd; i <= 7; i++) {
			var curCoord = slots[i - 2];
			if (i <= 4) {
				curSlot = '#' + team.regionLabel + ' .round.round-' + i + ' ul.matchup:nth-of-type('
					+ curCoord[0] + ') li.team.team-' + topOrBottom(curCoord[1]);
			} else if (i === 5) {
				curSlot = '.champion .semis-' + curCoord[0] + ' li.team.team-' + topOrBottom(curCoord[1]);
				$('#' + team.regionLabel + ' .mobile-f4-pick')
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

	confirmedTarget.appendChild(document.getElementById(data));
	onTeamDropped(team, parseInt(droppedOnRd), true);
}

/**
 * Handles a user-drop event. If the selected team was dropped onto a valid
 * slot, fill that team through the bracket to the selected slot.
 * @param {Object} team a Team object
 * @param {number} toRd the round number to promote the team to
 * @param {boolean} validDrop whether the initial drop was successful
 */
function onTeamDropped(team, toRd, validDrop) {
	var rd2Onward = findPossibleForwardSlots(team);
	var slots = [convertSeedToCoordinate(team.team_seed)].concat(rd2Onward);

	for (var i = 1; i <= 7; i++) {
		var curSlot = slots[i - 1];
		var oldClass;
		if (i <= 4) {
			oldClass = '#' + team.regionLabel + ' .round.round-' + i + ' ul.matchup:nth-of-type('
				+ curSlot[0] + ') li.team.team-' + topOrBottom(curSlot[1]);
		} else if (i === 5) {
			oldClass = '.champion .semis-' + curSlot[0] + ' li.team.team-' + topOrBottom(curSlot[1]);
			$('#' + team.regionLabel + ' .mobile-f4-pick')
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
				$('#' + team.regionLabel + ' .mobile-f4-pick')
					.empty()
					.removeClass('unset')
					.addClass('set')
					.append('<span class="mobile-f4-label">Final Four</span>')
					.append(teamToDiv(team));
			}
		}
	}
}

/**
 * Called when the Generate button is clicked in the header. Fill all slots in
 * the bracket that have not been given a user-selected team.
 */
function onGenerate() {

	// generate winners through final 4
	for (var i = 1; i <= 4; i++) {
		var numMatches = Math.pow(2, (4 - i));
		$('.round-' + i + ' ul.matchup').each(function (index, element) {
			// first, look forward and make sure the next round slot is unset
			var region = $(element).parents().eq(1).attr('id');
			var winnerCoord = findNextRdSlot((index % numMatches) + 1);
			var winnerSlot;
			if (i < 4) {
				winnerSlot = '#' + region + ' .round-' + (i + 1) + ' ul.matchup:nth-of-type(' + winnerCoord[0]
					+ ') li.team.team-' + topOrBottom(winnerCoord[1]);
				advanceAutoWinner(winnerSlot, element);
			} else if (i === 4) {
				var leftOrRight, topOrBot;
				if (region === "region-1" || region == "region-2") {
					leftOrRight = 'l';
				} else {
					leftOrRight = 'r';
				}
				if (region === "region-1" || region === "region-3") {
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
	$('ul.matchup.round-5').each(function (index, element) {
		winnerSlot = '.final ul.championship li.team.team-' + topOrBottom(index);
		advanceAutoWinner(winnerSlot, element);
	});

	// generate champion
	winnerSlot = '.fa.fa-trophy';
	advanceAutoWinner(winnerSlot, 'ul.matchup.round-6');
}

/**
 * Method used by onGenerate(). Given a target slot and a matchup, parse the
 * matchup teams, determine a winner and move the winner to the next slot
 * @param {Object} winnerSlot the target slot to advance the winning team to
 * @param {Object} matchupElement the matchup object containing the two
 * competing teams
 */
function advanceAutoWinner(winnerSlot, matchupElement) {
	if ($(winnerSlot).hasClass('unset')) {
		$(winnerSlot).empty();
		var topTeam = findTeamById($(matchupElement).find('li.team-top .teamObj').attr('id').substring(5))[0];
		var bottomTeam = findTeamById($(matchupElement).find('li.team-bottom .teamObj').attr('id').substring(5))[0];
		
		var winner;

		// calculate the chances of the top-coord team beating the bottom-coord team,
		// using derived Elo ratings as intermediate
		var topElo = probabilityToEloOffset(topTeam.team_rating);
		var botElo = probabilityToEloOffset(bottomTeam.team_rating);
		var topEloAdvantage = topElo - botElo;
		var topWinProb = 1 / (1 + 10 ** (-topEloAdvantage / 400));
		
		

		// bound the win probability percent to handle extremely lopsided matchups
		var winProbPct = Math.min(0.999, Math.max(0.001, topWinProb));

		var finalProb;
		var chaosPct = chaos * 0.01;
		if (chaosPct > 0.5) {
			// tilted towards chaos / more random outcomes
			var chaosFactor = 2 * (chaosPct - 0.5);

			// full chaos should mean every matchup is a coin flip
			var fullChaosWinProb = 0.5;

			// scale the intensity of the "full chaos" adjustment based on the given factor
			// TODO pure chaos should always be 50%
			finalProb = (chaosFactor * fullChaosWinProb) + (1 - chaosFactor) * winProbPct;
		
		} else if (chaosPct == 0.5) {

			// default setting: statistically balanced amount of chaos
			finalProb = winProbPct;
		
		} else if (chaosPct < 0.5) {

			// tilted towards chalk / more predictable outcomes
			var chalkFactor = 2 * (0.5 - chaosPct);

			// find the win prob if chalk = 100%
			var fullChalkWinProb = 0.31831 * Math.atan(63.291 * ((2 * winProbPct) - 1)) + 0.5;

			// scale the intensity of the "full chalk" adjustment based on the given factor
			finalProb = (chalkFactor * fullChalkWinProb) + (1 - chalkFactor) * winProbPct;
			
			
			console.log(finalProb);
		}
		
		

		if (finalProb > Math.random()) {
			winner = "top";
		} else {
			winner = "bottom";
		}
		
		$(matchupElement).find('li.team-' + winner + ' .teamObj').clone().appendTo($(winnerSlot));

		if ($(winnerSlot).parent().hasClass('round-5')) {
			/* var team = findTeamById(parseInt($(matchupElement).find('li.team-' + winner + ' .teamObj').attr('id')
					.substring(5)))[0];
			$('#' + team.regionLabel + ' .mobile-f4-pick')
				.empty()
				.append('<span class="mobile-f4-label">Final Four</span>')
				.append(teamToDiv(team));  FIXME */

		}
	}
}

/*
 * Given a decimal probability that a given team beats an average-strength team,
 * translate that probability into an Elo rating offset from 1500.
 */
function probabilityToEloOffset(prob) {
	return 173.7 * Math.log10(-prob/(prob-1));
}

/**
 * Method for mobile clients. Called when a user clicks a region button in the
 * bottom navbar. Animate a window scroll to the requested region.
 */
function navToSection(region) {
	$('html,body').animate({ scrollTop: $('#' + region).offset().top }, 'slow');
}

/**
 * Given a Team object, return an HTML div that can be placed into an arbitrary
 * matchup slot.
 */
function teamToDiv(team) {
	return ('<div class="teamObj" id="team_' + team.team_region + team.team_seed
			+ '" draggable="true" ondragstart="teamIsDraggingEvent(event)" ondragend="anyDrop(event)">'
			+ '<span class="teamName">' + team.team_name + '</span><span class="seed">'
			+ team.team_seed + '</span></div>');
}

/**
 * Returns an HTML-friendly representation of which side of the matchup a team
 * should be placed in, represented by the sel int
 */
function topOrBottom(sel) {
	switch (sel) {
		case 0:
			return 'top';
		case 1:
			return 'bottom';
		default:
			return null;
	}
}

/**
 * Given a team's seed, return the team's starting coordinate on the bracket in
 * the form [matchupNumber, topOrBottomPosition]
 */
function convertSeedToCoordinate(seed) {
	switch (seed) {
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

function regionNameToDivID(name) {
	switch (name) {
		case REGION_1_NAME:
			return "region-1";
		case REGION_2_NAME:
			return "region-2";
		case REGION_3_NAME:
			return "region-3";
		case REGION_4_NAME:
			return "region-4";
	}
}

/**
 * Given a Team object, find the slots on the board that the team can possibly
 * be promoted to. Return the result as an array with objects of the form
 * [matchupNumber, topOrBottomPosition].
 */
function findPossibleForwardSlots(team) {
	var r1Coord = convertSeedToCoordinate(team.team_seed);
	var curRdNth = r1Coord[0];
	var res = [];

	// handle the regional rounds first
	for (var i = 2; i <= 4; i++) {
		var nextRdPos = findNextRdSlot(curRdNth);
		curRdNth = nextRdPos[0];
		res.push(nextRdPos);
	}

	// handle the final 4 and champ rounds separately
	switch (team.team_region) {
		case REGION_1_NAME:
			res.push(['l', 0]);
			res.push(0);
			break;
		case REGION_2_NAME:
			res.push(['l', 1]);
			res.push(0);
			break;
		case REGION_3_NAME:
			res.push(['r', 0]);
			res.push(1);
			break;
		case REGION_4_NAME:
			res.push(['r', 1]);
			res.push(1);
			break;
		default:
			console.log("Error determining region for team " + team.team_id);
			return;
	}
	return res;
}

/**
 * Given the nth-of-type number of the selected matchup, return an array
 * representing the slot in the next round to advance the winner to, in the
 * form [matchupNumber, topOrBottomPosition].
 */
function findNextRdSlot(curRdNth) {
	var tob = (curRdNth - 1) % 2;
	var nextRdNth = Math.ceil(curRdNth / 2);
	return [nextRdNth, tob];
}

/**
 * Retrieve a full Team object by team ID.
 */
function findTeamById(id) {
	return $.grep(teamData, function (team) {
		return team.team_id === id;
	});
}

/**
 * TODO: advance a given team forward one round.
 */
function onTeamClicked(team, roundNo) {
	console.log('click'); 
}

/**
 * Called on mobile when the page is scrolled. Determine whether the Generate
 * button has scrolled above the top of the window. Perform CSS animations
 * to re-insert the button as a new footer, 
 */
function updateStickyElements() {
	var window_top = $(window).scrollTop();
	var top = $('#gen-anchor').offset().top;
	var window_y = window.innerHeight;
	var gen_banner_height = parseInt($('#gen-btn-wrapper').css('height'), 10)
		+ parseInt($('#gen-btn-wrapper').css('padding-top'), 10)
		+ parseInt($('#gen-btn-wrapper').css('padding-bottom'), 10);
	var window_space = window_y - parseInt($('#gen-btn-wrapper').css('height'), 10)
		- parseInt($('#gen-btn-wrapper').css('padding-top'), 10)
		- parseInt($('#gen-btn-wrapper').css('padding-bottom'), 10);;

	if (window_top > top && !animation_toggle && window.innerWidth < 420) {

		$('#gen-btn-wrapper').addClass('stick');
		$('#gen-btn-wrapper').css('top', 0);
		$('#gen-btn-wrapper').css('bottom', window_space + 'px');

		$('#gen-btn-wrapper').stop().animate({
			top: "+=" + window_space,
			bottom: "0"
		}, 750, function () {
			$('#gen-btn-wrapper').css('bottom', 0);
			$('#gen-btn-wrapper').css('top', '');
			animation_toggle = true;

			$('#regiontab').css('display', 'flex');
			$('#regiontab').stop().animate({
				bottom: gen_banner_height
			}, 750)
		});

	} else {
		//$('#gen-btn-wrapper').removeClass('stick');
		$('#gen-anchor').height(0);
	}
}

function formatMobile() {
	$('ul.matchup.championship.round-6').append($('.main-trophy'));
	$('.champion').css('padding-bottom', 35 + gen_banner_height);
	$('.main-trophy').css('margin-top', 30);
}

$(document).on('input', '#chalk', function () {
	chaos = $(this).val();
});

window.addEventListener("orientationchange", function () {
	console.log("the orientation of the device is now " + screen.orientation.angle);
});
