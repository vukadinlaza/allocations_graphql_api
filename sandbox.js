require('dotenv').config();

const { map, find, reduce, toNumber, groupBy } = require('lodash');
const { connect } = require('./src/mongo');
const { ObjectId } = require('mongodb');


const deals = [
	{
		"Deal Name": "First Frame I",
		"Organization": "",
		"Hide deal": ""
	},
	{
		"Deal Name": "Axiom Space SPV",
		"Organization": "",
		"Hide deal": ""
	},
	{
		"Deal Name": "AboveBoard Solutions",
		"Organization": "",
		"Hide deal": ""
	},
	{
		"Deal Name": "daniel.jay.hoffman@outlook.com",
		"Organization": "",
		"Hide deal": ""
	},
	{
		"Deal Name": "Tribe Capital V (Republic)",
		"Organization": "",
		"Hide deal": ""
	},
	{
		"Deal Name": "Insilico Medicine SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Abra",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Allocations Seed ($2M)",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Allocations Seed ($20M)",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Repair Biotechnologies SPV",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Ashvattha",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Insilico Medicine SPV II",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Mademan",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Alphagreen",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Methuselah Fund II",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "AxiomSpace SPV ",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Lean Hire SPV",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Test Deal 1",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Allocations Seed SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Focusmate SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX - Demo SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Nabis",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Oncosenx",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Elevated Returns",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Hayman Hong Kong Opportunities Onshore Fund SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Airbnb",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Allocations Series A Round",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Volumetric SPV2",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Science Fiction Venture Fund III",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Genesis Block SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Orbitfab",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Hayman Hong Kong Opportunities Onshore Fund SPV II",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "TransAstra",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Robinhood SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Tribe Capital LP",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Momentus",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Tesla SPV - Test Closed",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Oisin",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Demo SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Allocations Seed ($10M)",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "DocSend SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Turn Bio",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Juvenescence",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Allocations SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Allocations Seed ($5M)",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Luminous Computing via Gigafund 0.5 LP",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Relativity Space",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Allocations Seed SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Shiok Meats",
		"Organization": "Allocations",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Assure",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ashvattha SPV 2",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Wavebase",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Retrotope SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "YC Summer 2020 Demo Day Fund",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Bakkt",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "OTCXN",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Science Fiction Ventures Fund IV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ashvattha SPV 3",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Securitize",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "E2MC SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Volumetric SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "Allocations $60m Round SPV",
		"Organization": "Allocations",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV II",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Radian Aerospace II",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceFund SPV",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Voyager Space Holdings SPV",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Xplore",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Radian Aerospace I",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "EnergyX SPV",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Radian SPV migration",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Isle of Shoals Painting SPV",
		"Organization": "Helios Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Xplore SPV",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Space Forge",
		"Organization": "Helios Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Circumvent Pharmaceuticals SPV",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Miraculex SPV",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Toybox Labs SPV",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Foresight SPV",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Pocket Naloxone SPV",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Piggy Ride SPV",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "YourChoice Therapeutics SPV",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Aura Health",
		"Organization": "Mehta Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Focusmate",
		"Organization": "Perpetual Value Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Swarm",
		"Organization": "Perpetual Value Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Carta",
		"Organization": "Perpetual Value Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Airbnb",
		"Organization": "Perpetual Value Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "E2MC Space Fund",
		"Organization": "E2MC",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Skyloom SPV",
		"Organization": "E2MC",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Multi-Asset Space Fund",
		"Organization": "E2MC",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Lemur Capital Fund 1",
		"Organization": "Lemur Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Focusmate SPV",
		"Organization": "Lemur Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Volumetric SPV - Seed Round",
		"Organization": "Adastra Holdings",
		"Hide deal": ""
	},
	{
		"Deal Name": "Curative Inc SPV",
		"Organization": "Bouchard Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Altitude Angel SPV",
		"Organization": "Bouchard Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "CheckStep",
		"Organization": "Bouchard Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Lumi Space SPV",
		"Organization": "Bouchard Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Lumen SPV",
		"Organization": "Wentworth Hall Family Office",
		"Hide deal": ""
	},
	{
		"Deal Name": "Casca Design, Inc.",
		"Organization": "APA Venture Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Sevaro (StatMD)",
		"Organization": "APA Venture Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "GreyscaleAI",
		"Organization": "APA Venture Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Zero Collateral LLC SPV",
		"Organization": "Don Ventures LLC",
		"Hide deal": ""
	},
	{
		"Deal Name": "Helaxy",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Snafu Records",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Axiom Space (Series B) SPV",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "HelixNano",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Bios - BCI Company SPV",
		"Organization": "The Venture Collective",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "BlockFi SPV",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "VitroLabs SPV",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Vidya SPV",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Information Grid",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Axiom Space SPV",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Axiom Space Pre-IPO",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Goal Based Investors SPV",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Inflection Point Acquisition Corp SPV",
		"Organization": "The Venture Collective",
		"Hide deal": ""
	},
	{
		"Deal Name": "Repair Biotechnologies SPV",
		"Organization": "Repair Biotechnologies",
		"Hide deal": ""
	},
	{
		"Deal Name": "Rejuveron Life Sciences",
		"Organization": "Chris McCluskey",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Prométhée",
		"Organization": "Chris McCluskey",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Atmos SPV",
		"Organization": "Don Ho",
		"Hide deal": ""
	},
	{
		"Deal Name": "Humanyze",
		"Organization": "Romulus Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Cogito",
		"Organization": "Romulus Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "R42 Fund",
		"Organization": "R42 Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Repair Bio SPV",
		"Organization": "R42 Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV",
		"Organization": "Kyle Wang",
		"Hide deal": ""
	},
	{
		"Deal Name": "Grin Gaming",
		"Organization": "Elysium Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Longevity Card",
		"Organization": "Deep Knowledge Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Insilico Medicine SPV",
		"Organization": "Deep Knowledge Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Q-State Biosciences",
		"Organization": "Sam Frank",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Status Effect Gaming",
		"Organization": "Peter Xu",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "SpaceFund",
		"Organization": "SpaceFund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Orbit Fab SPV",
		"Organization": "SpaceFund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Cognitive Space",
		"Organization": "SpaceFund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Atmos",
		"Organization": "Don's Demo Day Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX",
		"Organization": "Science Fiction Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Luminous Computing Secondary",
		"Organization": "Organic Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Organic Ventures",
		"Organization": "Organic Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX",
		"Organization": "Stash Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV",
		"Organization": "Pomichter Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Atmos SPV",
		"Organization": "VCM Follow-On",
		"Hide deal": ""
	},
	{
		"Deal Name": "Defense Fund",
		"Organization": "Privateer Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Momentus SPV",
		"Organization": "Lambeth Family Office",
		"Hide deal": ""
	},
	{
		"Deal Name": "Stoke Space SPV",
		"Organization": "Lambeth Family Office",
		"Hide deal": ""
	},
	{
		"Deal Name": "Cerebreon",
		"Organization": "Consilience Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "AaDya Security",
		"Organization": "James Mertz Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Y Combinator S20 fund",
		"Organization": "First Frame LLC",
		"Hide deal": ""
	},
	{
		"Deal Name": "On Deck Runway Fund I SPV",
		"Organization": "First Frame LLC",
		"Hide deal": ""
	},
	{
		"Deal Name": "Mertz Energy \"Topaz\" Natural Gas Project SPV",
		"Organization": "Mertz Holdings",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "AaDya Security",
		"Organization": "Mertz Holdings",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "dHedge",
		"Organization": "Foster Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "APY Finance TEST",
		"Organization": "Foster Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "The Graph",
		"Organization": "Foster Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Luminous Computing",
		"Organization": "Browder Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Browder Capital LP",
		"Organization": "Browder Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV (Starbridge)",
		"Organization": "Starbridge Venture Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Axiom Space SPV (Starbridge VC)",
		"Organization": "Starbridge Venture Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Starbridge VC Fund I",
		"Organization": "Starbridge Venture Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Comma Capital Fund",
		"Organization": "Comma Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Viable Fit",
		"Organization": "Comma Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Alpha Ledger",
		"Organization": "Alphawave Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Docklight Brands",
		"Organization": "Alphawave Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Docbot",
		"Organization": "MV Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "2am Fund I",
		"Organization": "MV Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "CoinDCX",
		"Organization": "MV Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Axiom Space",
		"Organization": "Product Test Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV 1",
		"Organization": "Product Test Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Airbnb SPV",
		"Organization": "Product Test Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "ParaFi Capital Fund I",
		"Organization": "ParaFi Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "FTW Ventures II",
		"Organization": "FTW Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Grayscale Ethereum Trust SPV",
		"Organization": "256 Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "MadeMan SPV",
		"Organization": "Gardner Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Nabis SPV",
		"Organization": "Gardner Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Bering Waters SPV",
		"Organization": "Bering Waters",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Prysm",
		"Organization": "Thomas Scaria",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "SIMULATE",
		"Organization": "Metzger Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Metzger Ventures Fund I",
		"Organization": "Metzger Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Boom Supersonic",
		"Organization": "Metzger Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "WorldCoin",
		"Organization": "Metzger Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Longevity Banking Card",
		"Organization": "Longevity Card Deal",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "DiMarcantonio Ventures LP",
		"Organization": "DiMarcantonio Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Speechify SPV",
		"Organization": "Weitzman Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Weitzman Ventures Fund",
		"Organization": "Weitzman Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "ArcType Intelligence",
		"Organization": "Countdown Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Countdown Capital",
		"Organization": "Countdown Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Venus Aerospace",
		"Organization": "Countdown Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Avant Meats",
		"Organization": "Countdown Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Atomic Machines",
		"Organization": "Countdown Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Goldmount Capital DeFi Fund",
		"Organization": "Goldmount Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "On Deck Fellowship",
		"Organization": "On Deck",
		"Hide deal": ""
	},
	{
		"Deal Name": "Coinbase SPV",
		"Organization": "Multani Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Securitize SPV",
		"Organization": "Keiretsu Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Kitotech SPV",
		"Organization": "Keiretsu Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Keiretsu Capital Fund",
		"Organization": "Keiretsu Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Virion Biotherapeutics",
		"Organization": "Keiretsu Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Firework",
		"Organization": "Silicon Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Lambda School",
		"Organization": "Gigafund",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Demodesk",
		"Organization": "Balderton Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Balderton Capital LP",
		"Organization": "Balderton Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Type One Ventures Fund I ",
		"Organization": "Type One Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Nuvocargo",
		"Organization": "Type One Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Standard Cognition",
		"Organization": "Type One Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Esusu Financial",
		"Organization": "Type One Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Radian Aerospace",
		"Organization": "Type One Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Moons",
		"Organization": "Type One Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Applied Revenue LP",
		"Organization": "Applied Revenue",
		"Hide deal": ""
	},
	{
		"Deal Name": "AppLovin",
		"Organization": "Applied Revenue",
		"Hide deal": ""
	},
	{
		"Deal Name": "Osmosis",
		"Organization": "Rarebreed VC",
		"Hide deal": ""
	},
	{
		"Deal Name": "Rarebreed VC LP",
		"Organization": "Rarebreed VC",
		"Hide deal": ""
	},
	{
		"Deal Name": "Silicon Valley Bank LP",
		"Organization": "Silicon Valley Bank",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ouster",
		"Organization": "Silicon Valley Bank",
		"Hide deal": ""
	},
	{
		"Deal Name": "Reciprocal Ventures LP",
		"Organization": "Reciprocal Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "The Graph",
		"Organization": "Reciprocal Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Point72 LP",
		"Organization": "Point72",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "DriveWealth",
		"Organization": "Point72",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Vectr LP",
		"Organization": "Vectr",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Masterclass",
		"Organization": "Vectr",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Uplift",
		"Organization": "DNX Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Notion",
		"Organization": "DNX Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "DNX Ventures LP",
		"Organization": "DNX Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Second Measure",
		"Organization": "Weinstein Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Weinstein Capital LP",
		"Organization": "Weinstein Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Human Capital LP",
		"Organization": "Human Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Brex",
		"Organization": "Human Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "North Capital LP",
		"Organization": "North Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Sada Capital LP",
		"Organization": "Sada Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Flinto",
		"Organization": "Sada Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Rios Capital LP",
		"Organization": "Rios Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Eva Tech",
		"Organization": "Rios Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "The Legal Tech Fund LP",
		"Organization": "The Legal Tech Fund",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Brex",
		"Organization": "Global Founders Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Global Founders Capital LP",
		"Organization": "Global Founders Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Afore Capital LP",
		"Organization": "Afore Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Stream",
		"Organization": "Afore Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Celevity SPV",
		"Organization": "Nichols Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Ondeck Fellowship SPV Fund",
		"Organization": "Nichols Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Deliveroo",
		"Organization": "Leaf Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Leaf Ventures LP",
		"Organization": "Leaf Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Lumanu",
		"Organization": "Castor Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "The Premiere",
		"Organization": "Castor Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Prodigy",
		"Organization": "Castor Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Castor Ventures LP",
		"Organization": "Castor Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "BRIO Systems",
		"Organization": "Castor Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Dover Series A SPV",
		"Organization": "Kolysh Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Greycroft LP",
		"Organization": "Greycroft",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Bumble",
		"Organization": "Greycroft",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Skyways SPV",
		"Organization": "The Council",
		"Hide deal": ""
	},
	{
		"Deal Name": "Affirm",
		"Organization": "Toy Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "OpenView LP",
		"Organization": "OpenView",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Calendly",
		"Organization": "OpenView",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Circle",
		"Organization": "Bungalow Capital Management",
		"Hide deal": ""
	},
	{
		"Deal Name": "Bungalow Capital Management LP",
		"Organization": "Bungalow Capital Management",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Avro Life Sciences Fund 1",
		"Organization": "Avro Life Sciences",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "OS Fund 1",
		"Organization": "OS Fund",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Atomwise",
		"Organization": "OS Fund",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Nexxus Holdings Fund 1",
		"Organization": "Nexxus Holdings",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Squark SPV",
		"Organization": "TBD Angels",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "TBD Angels Fund",
		"Organization": "TBD Angels",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Climate Robotics SPV",
		"Organization": "Tango VC",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Polymath Capital Partners LP",
		"Organization": "Polymath Capital Partners",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Celevity SPV",
		"Organization": "Polymath Capital Partners",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Robinhood SPV",
		"Organization": "Susa Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Susa Ventures LP",
		"Organization": "Susa Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Lambda School",
		"Organization": "Pioneer Fund",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Pioneer Fund LP",
		"Organization": "Pioneer Fund",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Marc Bell Ventures LP",
		"Organization": "Marc Bell Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Medcorder",
		"Organization": "Xoogler Syndicate",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Xoogler Syndicate Fund",
		"Organization": "Xoogler Syndicate",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Pace Capital Fund",
		"Organization": "Pace Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Compound Fund",
		"Organization": "Compound",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Compound SPV",
		"Organization": "Compound",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Gorgias",
		"Organization": "Guillaume Cabane Syndicate",
		"Hide deal": ""
	},
	{
		"Deal Name": "Romeen Sheth Syndicate Fund",
		"Organization": "Romeen Sheth Syndicate",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Bid Ops",
		"Organization": "El Cap Holdings",
		"Hide deal": ""
	},
	{
		"Deal Name": "El Cap Holdings Fund",
		"Organization": "El Cap Holdings",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "The Mom Project",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Fulcrum",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Vagabond Vending (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Genomenon",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Revive",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Coolfire (Follow-on #2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "IA TayCo",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "AgenDx / NanDio (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "BasePaws",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "BiomeSense",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Emu",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ash & Erie (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "BTT (Second Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "AllVoices",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Vennli (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Vagabond Vending",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "The Mom Project (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Eyelation",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Genomenon",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Hallow",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "1debit (Chime)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Caretaker Medical",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Gatsby",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "MarginEdge (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Akouba Credit",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "IA KetoNatural Pet Foods",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Interior Define (Follow-On)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Page Vault (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Conservation Labs",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Wolf & Shepherd (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ayoba-Yo",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Infinite Composites Technologies",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Thousand Fell",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "CargoSense",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "NanDio",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Revive\n(Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Interior Define",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Coolfire (Follow On)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "ShotTracker (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Popwallet",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "IA Leasecake SPV",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Poppy",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "IA Elevate K-12 Follow On SPV",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Rivet Radio",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Eat Pakd (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Appcast (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Sightbox",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Psyonic",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "BTT (Third Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Babyscripts",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "PageVault (Follow-on #2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Vennli",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "LHM",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "CargoSense (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "ZipFit\n(Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Kidizen",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "MarginEdge",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Micro-LAM",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ash & Erie",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "myCOI",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "rivs (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Wolf & Shepherd (Follow-on 2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Superstar",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Appcast",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "The Mom Project (Follow-on 2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Page Vault",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Genomenon (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Carpe",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Snooz",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Zero Grocery",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "RIVS (Follow on 2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "MarginEdge (Follow-on 2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "ZipFit",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "MarginEdge (Follow-on 3)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "GroupSense (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Tradingview",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "The Renewal Workshop",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "ShotTracker",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Blue Triangle Tech",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "ShotTracker (Follow-on #2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Neoantigenics",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Micro-LAM (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Blue Triangle Technologies (Follow-on 4)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Elevate K-12",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Coolfire Solutions",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Rentlytics",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Enklu",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Vagabond Vending (Follow-on #2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Catalyst",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Alembic",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Wünder",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "CareTaker (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Catalyst Ortho (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Blue Triangles Tech (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Abode",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "SimplifyASC",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "UpCity",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "rivs",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Enklu (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Conservation Labs (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Row One",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "AbiliTech",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Fanbank (FB)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Pattern89 (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Vapogenix",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Nurture Life",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Superstar Games (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "TechStars Follow-on",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Wolf & Shepherd",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Emu (Follow-on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Enklu Common (secondary)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Pattern89",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Emu (Follow-on #2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Elevate K-12 (Follow-on 2)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Techstars Chicago",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Elevate K-12 (Follow on)",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Eat Pak'd",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Malomo",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "ClearFlame",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Soona",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Retrium",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "GroupSense",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "Placer SPV",
		"Organization": "Vitalize Venture Group",
		"Hide deal": ""
	},
	{
		"Deal Name": "SyndicateRoom Access Fund",
		"Organization": "SyndicateRoom",
		"Hide deal": ""
	},
	{
		"Deal Name": "Emerging Human Fund",
		"Organization": "Emerging Human",
		"Hide deal": ""
	},
	{
		"Deal Name": "Factmata",
		"Organization": "Nesta Italia",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Sana Health",
		"Organization": "WPSS Investments",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Mosa Meat",
		"Organization": "Mosa Meat Demo",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Hitchhiker VC Fund",
		"Organization": "Hitchhiker VC",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Outlier Ventures Fund",
		"Organization": "Outlier Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "AM Analysis Fund",
		"Organization": "AM Analysis",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Quarterly Seed Fund",
		"Organization": "Demo Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Testing",
		"Organization": "Demo Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Nabis",
		"Organization": "UMANA",
		"Hide deal": ""
	},
	{
		"Deal Name": "Underdog Pharmaceuticals",
		"Organization": "SENS Research Foundation",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "SENS fund",
		"Organization": "SENS Research Foundation",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Delphi Digital Fund",
		"Organization": "Delphi Digital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "MoneyMade SPV",
		"Organization": "Moneymade",
		"Hide deal": ""
	},
	{
		"Deal Name": "8808 Ventures Fund",
		"Organization": "8808 Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Moneymail SPV",
		"Organization": "Moneymail",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Shruti Shah Fund",
		"Organization": "Shruti Shah",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Keiki Capital Fund",
		"Organization": "Keiki Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "MoonRise Fund I",
		"Organization": "Moonrise Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Quaesto Fund",
		"Organization": "Quaestor",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Brex",
		"Organization": "Quaestor",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Alto IRA Fund",
		"Organization": "Alto IRA",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX (TomorrowLand Ventures II)",
		"Organization": "Tomorrow Land Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Tribe XR",
		"Organization": "Tomorrow Land Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Andrew Stickney Fund",
		"Organization": "Andrew Stickney",
		"Hide deal": ""
	},
	{
		"Deal Name": "Quedma",
		"Organization": "Quedma",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Born2Code.vc Fund",
		"Organization": "Born2Code.vc",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ask Sebby Fund",
		"Organization": "Ask Sebby",
		"Hide deal": ""
	},
	{
		"Deal Name": "Gillian Muessig Fund",
		"Organization": "Masters VC",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Accolade Fund",
		"Organization": "Accolade Partners",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "SLOPE Fund",
		"Organization": "SLOPE",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Prodigy Fund I",
		"Organization": "Prodigy Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Purpose Built Ventures Fund",
		"Organization": "Miles Lasater",
		"Hide deal": ""
	},
	{
		"Deal Name": "Relativity Space",
		"Organization": "Republic Labs",
		"Hide deal": ""
	},
	{
		"Deal Name": "Starface World",
		"Organization": "BBG Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "SiteRx (TrialSight) SPV",
		"Organization": "CoFound Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Gentem Health",
		"Organization": "CoFound Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Wharton Alumni Network Fund",
		"Organization": "Wharton Alumni Network",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Boom Supersonic",
		"Organization": "Whoa",
		"Hide deal": ""
	},
	{
		"Deal Name": "Human VC Fund",
		"Organization": "Human VC",
		"Hide deal": ""
	},
	{
		"Deal Name": "Bruno Faviero Fund",
		"Organization": "Bruno Faviero",
		"Hide deal": ""
	},
	{
		"Deal Name": "Temple of Light Tulum Property SPV",
		"Organization": "Rainmakers",
		"Hide deal": ""
	},
	{
		"Deal Name": "Bizly",
		"Organization": "JourneyOne",
		"Hide deal": ""
	},
	{
		"Deal Name": "Swaypay",
		"Organization": "JourneyOne",
		"Hide deal": ""
	},
	{
		"Deal Name": "Wünder",
		"Organization": "JourneyOne",
		"Hide deal": ""
	},
	{
		"Deal Name": "Volumetric",
		"Organization": "Methuselah Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "M Fund II",
		"Organization": "Methuselah Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "Clement Dai Fund",
		"Organization": "Clement Dai",
		"Hide deal": ""
	},
	{
		"Deal Name": "Daniyar Nursultan Fund",
		"Organization": "Daniyar Nursultan",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Crescite Ventures Fund",
		"Organization": "Crescite Ventures",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Orbital Sidekick",
		"Organization": "Syndicate 708",
		"Hide deal": ""
	},
	{
		"Deal Name": "Base Layer VC Fund",
		"Organization": "Base Layer VC",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Proper Wealth Management Fund",
		"Organization": "Proper Wealth Management",
		"Hide deal": ""
	},
	{
		"Deal Name": "Axiom Space (via Starbridge)",
		"Organization": "Seedford Partners",
		"Hide deal": ""
	},
	{
		"Deal Name": "Lemonade",
		"Organization": "Digital Horizon",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Lily Lee Fund",
		"Organization": "Lily Lee",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "SpaceX",
		"Organization": "Animal Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Animal Capital Fund",
		"Organization": "Animal Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Heijin Capital Fund",
		"Organization": "Heijin Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Udemy",
		"Organization": "DN Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Commune Angels Fund",
		"Organization": "Commune Angels",
		"Hide deal": ""
	},
	{
		"Deal Name": "AboveBoard Solutions",
		"Organization": "Commune Angels",
		"Hide deal": ""
	},
	{
		"Deal Name": "Relativity Space",
		"Organization": "Rebel One Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Paige Doherty Fund",
		"Organization": "Paige Doherty",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Race Capital Fund",
		"Organization": "Race Capital",
		"Hide deal": "checked"
	},
	{
		"Deal Name": "Pico Networks",
		"Organization": "Fabri Caracausi",
		"Hide deal": ""
	},
	{
		"Deal Name": "Onet SPV",
		"Organization": "Sampriti Bhattacharyya",
		"Hide deal": ""
	},
	{
		"Deal Name": "Michael Caruso Fund",
		"Organization": "Michael Caruso",
		"Hide deal": ""
	},
	{
		"Deal Name": "Therma",
		"Organization": "C6 Syndicate",
		"Hide deal": ""
	},
	{
		"Deal Name": "305 Ventures",
		"Organization": "305 Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Breakout Growth Fund (SpaceX)",
		"Organization": "Reset Syndicate I",
		"Hide deal": ""
	},
	{
		"Deal Name": "Lagomorphic Fund",
		"Organization": "Lagomorphic Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Voyager Space Holdings",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Amprius SPV",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Kiverdi SPV",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Natel Energy SPV",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Mission Barns",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Prithvi Ventures LP",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "6K Inc.",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Turtle Tree Labs SPV",
		"Organization": "Prithvi Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Luminous SPV",
		"Organization": "Schams Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Chicory",
		"Organization": "Alpaca VC",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV",
		"Organization": "AGE Fund",
		"Hide deal": ""
	},
	{
		"Deal Name": "EverlyWell (Forge)",
		"Organization": "Equiam",
		"Hide deal": ""
	},
	{
		"Deal Name": "Aurvandil Acquisition Corp SPV",
		"Organization": "Hemisphere Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Lynk Global",
		"Organization": "Hemisphere Ventures",
		"Hide deal": ""
	},
	{
		"Deal Name": "Leasecake",
		"Organization": "Miami Angels",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV",
		"Organization": "Sean Mahsoul",
		"Hide deal": ""
	},
	{
		"Deal Name": "test",
		"Organization": "lance@allocations.com's Fund - recBLhdMee7gixsgC",
		"Hide deal": ""
	},
	{
		"Deal Name": "SpaceX SPV",
		"Organization": "Mansi Capital",
		"Hide deal": ""
	},
	{
		"Deal Name": "Biscayne 31 - Polychain Capital - Ventures II",
		"Organization": "Biscayne 31 - Polychain Capital: Ventures II",
		"Hide deal": ""
	},
	{
		"Deal Name": "MyMarkit SPV",
		"Organization": "Justin Walker",
		"Hide deal": ""
	},
	{
		"Deal Name": "Ramp SPV",
		"Organization": "Hypergrowth",
		"Hide deal": ""
	}
].filter(d => {
	return d['Hide deal'] === 'checked'
});

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()

		const x = await Promise.all(deals.map(async deal => {
			const org = await db.organizations.findOne({ name: deal['Organization'] })
			if (org === null) return false;

			const foundDeal = await db.deals.findOne({ company_name: deal['Deal Name'], organization: ObjectId(org._id) })
			// delete action

			if (foundDeal === null) return false;
			await db.deals.deleteOne({ _id: ObjectId(foundDeal._id), organization: ObjectId(org._id) })
			await db.investments.deleteMany({ organization: ObjectId(org._id), deal_id: ObjectId(foundDeal._id) })
			return foundDeal
		}))

		console.log('found stuff', x.filter(d => d))

		console.log(`\n=== Success! Updating Investment Status===\n`);
		process.exit(0);
	} catch (err) {
		console.log(
			`\n=== ERROR! Updating Investment Status \n`,
			err
		);
		process.exit(1);
	}
})();