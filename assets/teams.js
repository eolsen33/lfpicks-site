// NFL teams keyed by the full name The Odds API uses. Colors are the teams'
// published primary/secondary; no logos (trademarks) — the abbreviation badge
// in team colors is the identity.
window.NFL_TEAMS = {
  "Arizona Cardinals":      { abbr: "ARI", city: "Arizona",       nick: "Cardinals",  c1: "#97233F", c2: "#FFB612" },
  "Atlanta Falcons":        { abbr: "ATL", city: "Atlanta",       nick: "Falcons",    c1: "#A71930", c2: "#000000" },
  "Baltimore Ravens":       { abbr: "BAL", city: "Baltimore",     nick: "Ravens",     c1: "#241773", c2: "#9E7C0C" },
  "Buffalo Bills":          { abbr: "BUF", city: "Buffalo",       nick: "Bills",      c1: "#00338D", c2: "#C60C30" },
  "Carolina Panthers":      { abbr: "CAR", city: "Carolina",      nick: "Panthers",   c1: "#0085CA", c2: "#101820" },
  "Chicago Bears":          { abbr: "CHI", city: "Chicago",       nick: "Bears",      c1: "#0B162A", c2: "#C83803" },
  "Cincinnati Bengals":     { abbr: "CIN", city: "Cincinnati",    nick: "Bengals",    c1: "#FB4F14", c2: "#000000" },
  "Cleveland Browns":       { abbr: "CLE", city: "Cleveland",     nick: "Browns",     c1: "#311D00", c2: "#FF3C00" },
  "Dallas Cowboys":         { abbr: "DAL", city: "Dallas",        nick: "Cowboys",    c1: "#003594", c2: "#869397" },
  "Denver Broncos":         { abbr: "DEN", city: "Denver",        nick: "Broncos",    c1: "#FB4F14", c2: "#002244" },
  "Detroit Lions":          { abbr: "DET", city: "Detroit",       nick: "Lions",      c1: "#0076B6", c2: "#B0B7BC" },
  "Green Bay Packers":      { abbr: "GB",  city: "Green Bay",     nick: "Packers",    c1: "#203731", c2: "#FFB612" },
  "Houston Texans":         { abbr: "HOU", city: "Houston",       nick: "Texans",     c1: "#03202F", c2: "#A71930" },
  "Indianapolis Colts":     { abbr: "IND", city: "Indianapolis",  nick: "Colts",      c1: "#002C5F", c2: "#A2AAAD" },
  "Jacksonville Jaguars":   { abbr: "JAX", city: "Jacksonville",  nick: "Jaguars",    c1: "#006778", c2: "#D7A22A" },
  "Kansas City Chiefs":     { abbr: "KC",  city: "Kansas City",   nick: "Chiefs",     c1: "#E31837", c2: "#FFB81C" },
  "Las Vegas Raiders":      { abbr: "LV",  city: "Las Vegas",     nick: "Raiders",    c1: "#000000", c2: "#A5ACAF" },
  "Los Angeles Chargers":   { abbr: "LAC", city: "Los Angeles",   nick: "Chargers",   c1: "#0080C6", c2: "#FFC20E" },
  "Los Angeles Rams":       { abbr: "LAR", city: "Los Angeles",   nick: "Rams",       c1: "#003594", c2: "#FFA300" },
  "Miami Dolphins":         { abbr: "MIA", city: "Miami",         nick: "Dolphins",   c1: "#008E97", c2: "#FC4C02" },
  "Minnesota Vikings":      { abbr: "MIN", city: "Minnesota",     nick: "Vikings",    c1: "#4F2683", c2: "#FFC62F" },
  "New England Patriots":   { abbr: "NE",  city: "New England",   nick: "Patriots",   c1: "#002244", c2: "#C60C30" },
  "New Orleans Saints":     { abbr: "NO",  city: "New Orleans",   nick: "Saints",     c1: "#101820", c2: "#D3BC8D" },
  "New York Giants":        { abbr: "NYG", city: "New York",      nick: "Giants",     c1: "#0B2265", c2: "#A71930" },
  "New York Jets":          { abbr: "NYJ", city: "New York",      nick: "Jets",       c1: "#125740", c2: "#FFFFFF" },
  "Philadelphia Eagles":    { abbr: "PHI", city: "Philadelphia",  nick: "Eagles",     c1: "#004C54", c2: "#A5ACAF" },
  "Pittsburgh Steelers":    { abbr: "PIT", city: "Pittsburgh",    nick: "Steelers",   c1: "#FFB612", c2: "#101820" },
  "San Francisco 49ers":    { abbr: "SF",  city: "San Francisco", nick: "49ers",      c1: "#AA0000", c2: "#B3995D" },
  "Seattle Seahawks":       { abbr: "SEA", city: "Seattle",       nick: "Seahawks",   c1: "#002244", c2: "#69BE28" },
  "Tampa Bay Buccaneers":   { abbr: "TB",  city: "Tampa Bay",     nick: "Buccaneers", c1: "#D50A0A", c2: "#34302B" },
  "Tennessee Titans":       { abbr: "TEN", city: "Tennessee",     nick: "Titans",     c1: "#0C2340", c2: "#4B92DB" },
  "Washington Commanders":  { abbr: "WAS", city: "Washington",    nick: "Commanders", c1: "#5A1414", c2: "#FFB612" }
};
window.teamInfo = function (name) {
  return window.NFL_TEAMS[name] || { abbr: name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(), city: name, nick: name, c1: "#3A3F4B", c2: "#9AA0AE" };
};
