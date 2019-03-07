var teamData;

function allowDrop(ev) {
	ev.preventDefault();
}

function drag(ev) {
	ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("text");
	ev.target.appendChild(document.getElementById(data));
}

function assignTeamToMatchup(team, matchup) {
	
}

function teamToDiv(team) {
	return ('<div id="team_' + team.team_id + '">' + team.team_name + '<span class="seed">' + team.team_seed + '</span></div>');
}

function topOrBottom(sel) {
	switch(sel) {
		case 1:
			return 'top';
		case 2:
			return 'bottom';
		default:
			return null;
	}
}

function convertSeedToCoordinate(seed) {
	switch(seed) {
		case 1:
			return [1, 1];
		case 2:
			return [8, 1];
		case 3:
			return [6, 1];
		case 4:
			return [4, 1];
		case 5:
			return [3, 1];
		case 6:
			return [5, 1];
		case 7:
			return [7, 1];
		case 8:
			return [2, 1];
		case 9:
			return [2, 2];
		case 10:
			return [7, 2];
		case 11:
			return [5, 2];
		case 12:
			return [3, 2];
		case 13:
			return [4, 2];
		case 14:
			return [6, 2];
		case 15:
			return [8, 2];
		case 16:
			return [1, 2];
		default:
			return [0, 0];
	}
}

function populateBracket() {
	teamData.forEach(function (team) {
		var coord = convertSeedToCoordinate(team.team_seed);
		var fin = '#' + team.team_region + ' .round-64 ul.matchup:nth-of-type(' + coord[0] + ') .team-' + topOrBottom(coord[1]);
		console.log(fin);
		$(fin).html(teamToDiv(team));
	});
}

$(document).ready(function() {
	
	$("#intro").html("Hello, World!");
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
				populateBracket();
			}
		});
	});
});