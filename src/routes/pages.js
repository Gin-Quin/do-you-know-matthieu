export const pages = [
	{
		ask: "Quelle taille fait Matthieu ?",
		display: "image",
		answers: [
			{
				value: "Plus de quatre-vingt centimètres",
				image: "img/height-2.png",
				valid: true,
			},
			{
				value: "Moins de deux mètres quarante",
				image: "img/height-1.png",
				valid: true,
			},
			{
				value: "Entre quatre-vingt centimètres et deux mètres quarante",
				image: "img/height-3.png",
				valid: true,
			},
		],
		outro: `
			face wink
			say Bien joué frère, tu gères ! Question suivante !
		`
	},

	{
		ask: "Combien de dents a Matthieu ?",
		display: "image",
		answers: [
			{
				value: "Deux",
				image: "img/teeth-1.png",
			},
			{
				value: "Quatorze en hauts, quatorze en bas",
				image: "img/teeth-2.png",
				valid: true,
			},
			{
				value: "Cent trente-deux",
				image: "img/teeth-3.png",
			},
			{
				value: "Il porte un dentier",
				image: "img/teeth-4.png",
			},
		],
		outro: `
			say Yeah!
			face big-smile
			say Seul un super pote peut savoir que j'ai exactement 28 dents.
			face smile
			say Tu es vraiment un super pote. Je t'adore. Continue comme ça.
		`
	},

	{
		ask: "Quel âge a Matthieu ?",
		display: "image",
		answers: [
			{
				value: "Son nombre de dents en années s'il était né en Corée",
				image: "img/teeth-2.png",
				valid: true,
			},
			{
				value: "Trois ans",
				image: "img/baby-3.png",
			},
		],
		outro: `
			say Encore bon !
			say En Corée, on a un an le jour de notre naissance.
			say Les premières questions sont les plus faciles.
			face smile
			say On continue.
		`
	},


	{
		ask: "À quelle vitesse Matthieu peut-il courir ?",
		display: "image",
		answers: [
			{
				value: "À la vitesse d'un crocodile en chasse",
				image: "img/crocodile.png",
				action: `
					face still
					say Wow quand même pas. ça fait des pointes jusqu'à 25 kilomètres par heure ces bêtes-là...
				`,
			},
			{
				value: "À la vitesse d'un guépard",
				image: "img/guepard.png",
			},
			{
				value: "À la vitesse d'un Bell X-2 Starbuster",
				image: "img/plane.png",
			},
			{
				value: "Il peut rejoindre la boulangerie la plus proche en moins de 5 minutes top chrono pour s'acheter un fraisier",
				image: "img/boulangerie.png",
				valid: true,
			},
		],
		outro: `
			face super-cool
			say Un peu que je peux !
			say Je suis un prédateur.
			say Même au fond de leur terrier...
			say Les pâtisseries n'ont aucune chance.
		`
	},


	{
		ask: "Que se passe-t-il quand Matthieu se met un coton-tige dans l'oreille gauche ?",
		answers: [
			{
				value: "Ça lui lave l'oreille droite",
				action: `
					face smile
					say Ce serait drôle, mais non.
				`
			},

			{
				value: "Ça lui lave l'oreille gauche",
				valid: true,
				action: `
					face smile
					say Indéniablement.
				`
			},

			{
				value: "Un papillon bat des ailes au Brésil",
				action: `
					face eye-right
					say Pas que je sache.
				`
			},

			{
				value: "Il tousse",
				valid: true,
				action: `
					face eye-left
					say Ouais, c'est étrange mais j'ai ce réflexe.
					face standard
					say Une sombre histoire de trompe d'Eustache.
					face super-cool
					say Spéciale dédi à <b>Nique ta crotte</b> !
					face standard
				`
			},
		],

		outro: `
			say Next.
		`
	},


	{
		ask: "Matthieu préfère-t-il...",
		answers: [
			{
				value: "Perdre un bras",
			},
			{
				value: "Se faire enculer",
				valid: true,
			},
		],
		outro: `
			face big-smile
			say Hehe !
			face still
			say Quand j'avais 19 ans et que j'étais bourré je m'amusais à poser cette question à des mecs random dans la rue.
			face standard
			say « Tu préfères perdre un bras ou te faire enculer ? »
			say ...
			face smile
			say À peu près la moitié des gars répondait perdre un bras.
			face still
			say Bon.
			face angry
			say On passe aux choses sérieuses maintenant.
			face still
			say Seul un pote sur trois est arrivé aussi loin que toi sans se tromper.
			say Ça montre déjà que tu es un giga-super pote de la mort, mais...
			face angry
			say Il va falloir montrer que tu vaux mieux que tous les autres !
			face thinking
			say La question suivante est à <b>choix multiple</b>. Une seule mauvaise réponse... et c'est <b>l'élimination</b>.
			face standard
			say Evidemment, je ne te dis pas combien il y a de bonnes réponses.
			face wink
			say Je compte sur toi. Bonne chance !
		`
	},

	{
		ask: "Qu'est-ce qui attire Matthieu chez une fille ?",
		requestedAnswers: 5,
		answers: [
			{
				value: "La beauté",
				valid: true,
				action: `
					say Héhé oui, je suis attiré par les personnes que je trouve belles.
				`,
			},
			{
				value: "L'humour",
				valid: true,
				action: `
					say Tout à fait ! Pas d'humour, pas d'amour.
				`,
			},
			{
				value: "L'intelligence",
				valid: true,
				action: `
					say Yes, l'intelligence c'est trop sexy !
				`,
			},
			{
				value: "Le talent",
				valid: true,
				action: `
					say Le talent c'est merveilleux. Le talent ça fait rêver.
				`,
			},
			{
				value: "La personnalité",
				valid: true,
				action: `
					say Rien de plus attrayant qu'une personnalité riche ou surprenante.
				`,
			},
		],
		outro: `
			face still
			say Wow !
			say Tu as tout trouvé sans te faire éliminer !
			say C'est... impressionnant.
			face standard
			say Seul 38% des potes sont arrivés jusque-là.
			face wink
			say Tu déchires tout. Question suivante !
		`
	},

	{
		ask: "Qu'est-ce que Matthieu aime manger ?",
		display: "image",
		answers: [
			{
				value: "De la bonne nourriture",
				image: "img/good-food.png",
				valid: true,
			},
			{
				value: "Du caca",
				image: "img/caca.png",
			},
		],
		outro: `
			face big-smile
			say Oui ! J'adore manger de la bonne nourriture !
			say Des sushis, des rouleaux de printemps, des salades de fruit, des omelettes norvégiennes...
			face slightly-mad
			say ... des fraisiers, des framboisiers, des cassissiers, des génoises...
			face smile
			say ... du chocolat noir blanc au lait en poudre en mousse en fondant...
			say ... des frites cuites deux fois, des pizzas avec un verre de vin italien, des burgers maisons, des pancakes trop beurrés...
			face happiest
			say ... du jus de cassis ! des oranges pressées avec des glaçons et un zeste de citron !...
			say ... des canellonnis à la chlorophylle avec sa mousse de potimarron !...
			say ... des...
			face laugh-with-tears
			say ... des glaces six boules melon pistache amande blonde chocolat stracciatella vanille de madagascar !...
			say ... des bananes avec de la pâte à tartiner aux noisettes 35% de noisettes minimum et une dose déraisonnable de chantilly !...
			face crying
			say Snif. Que le monde est beau !
			say Si beauuuu...!
			face tear
			say Snif.
			face standard
			say En revanche, je n'aime pas manger du caca.
			say Question suivante.
		`
	},

	{
		ask: "Est-ce que Matthieu s'ennuie pendant le confinement ?",
		answers: [
			{
				value: "Oui",
				valid: true,
			},
		],
		outro: `
			say Tu me connais si bien...
			say Je t'aime.
			say Seul 14% des potes sont arrivés aussi loin.
			say Il ne te reste plus que quatre questions.
			face eye-right
			say Personne n'a réussi à répondre correctement à ces quatre questions.
			face eye-left
			say Si tu y arrives...
			face standard
			say Cela signifie que tu es la personne qui me connaît le mieux au monde.
			say L'élu.
			say ...
			say Je veux croire en toi.
		`
	},


	{
		ask: "Si Matthieu avait un pouvoir, ce serait...",
		answers: [
			{
				value: "Voler",
				valid: true,
				action: `
					say Yes! Voler, quel bonheur ce serait.
					face eye-left
					say Mmmmh...
				`
			},
			{
				value: "Se métamorphoser",
				valid: true,
				action: `
					say Je pourrais faire tellement de choses si je pouvais me métamorphoser.
					face eye-left
					say Tellement.
				`
			},
			{
				value: "Se téléporter",
				valid: true,
				action: `
					say Plus de transports en commun !
					say Plus d'Uber à payer pour rentrer de soirée !
					say Le pouvoir du voyageur.
				`
			},
		],
		outro: `
			face smile
			say Bravo.
		`
	},


	{
		ask: "Quel instrument de musique Matthieu sait-il jouer ?",
		display: "image",
		requestedAnswers: 2,
		answers: [
			{
				value: "De la trompette",
				valid: true,
				image: "img/trumpet.png",
				action: `
					say Yes!
				`
			},
			{
				value: "De la flûte à bec",
				valid: true,
				image: "img/flute.png",
				action: `
					say Exact.
				`
			},
			{
				value: "Du piano",
				valid: true,
				image: "img/piano.png",
				action: `
					say Bien vu.
				`
			},
			{
				value: "Du triangle",
				valid: true,
				image: "img/triangle-2.png",
				action: `
					face super-cool
					say Je suis un pro du triangle.
				`
			},
		],
		outro: `
			face smile
			say Hehe !
			face wink
			say Tu me connais par coeur !
			face standard
			say Plus que deux questions.
			face standard
			say La prochaine est la plus dure...
			face still
			say Et tu n'auras aucun indice !
			face standard
			say Mais je crois en toi.
			face smile
			say Tu peux le faire !
		`
	},
	

	{
		ask: "Quel est le livre préféré de Matthieu ?",
		answers: [
			{ value: "L'insoutenable légèreté de l'être", valid: true},
			{ value: "Bambi", valid: true},
			{ value: "La promesse de l'aube", valid: true},
			{ value: "Les frères Karamazov", valid: true},
			{ value: "The last samurai", valid: true},
			{ value: "Ada ou l'ardeur", valid: true},
			{ value: "Le clan des Otori", valid: true},
			{ value: "Océan mer", valid: true},
			{ value: "Okilélé", valid: true},
			{ value: "Les souffrances du jeune Werther", valid: true},
			{ value: "Les liaisons dangereuses", valid: true},
			{ value: "Le chat Murr", valid: true},
			{ value: "L'assassin royal", valid: true},
			{ value: "Fanfan", valid: true},
		],
		outro: `
			face gosh
			say Wow!
			say Comment tu as réussi à trouver celui-là ?
			face smile
			say J'adore ce livre !
			face gosh
			say Je ne m'attendais vraiment pas à ce que tu trouves la bonne réponse.
			face standard
			say Tu as fait tout ce chemin sans la plus petite erreur, wow.
			say Peut-être que...
			face still
			say Peut-être que tu es vraiment l'élu.
			say Le pote de ma vie.
			say ...
			face standard
			say Il ne te reste qu'une question.
			face still
			say <b>Une !</b>
			face wink
			say Elle est plutôt facile.
			face standard
			say Rends-moi fier.
		`
	},


	{
		ask: "Quel est le film préféré de Matthieu ?",
		answers: [
			{ value: "Cloud atlas", valid: false},
			{ value: "The grand Budapest hotel", valid: false},
		],
		outro: `
			face gosh
			say Que... quoi ?
			say Ce n'est pas du tout mon film préféré !
			face still
			say Comment tu as pu...
			face tear
			say ...te tromper à cette question...
			say ...toi!...
			say
			hide face
			wait 1150
			story ending
		`
	},
]