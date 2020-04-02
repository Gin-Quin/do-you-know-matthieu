
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const wrongs = [
    	"Mmmm, t'es sûr de toi là ?",
    	"Whaaa, on se calme ! Réfléchis frère. T'as tout ton temps.",
    	"...",
    	"Non, pas vraiment.",
    	"Petit indice : essaie autre chose.",
    	"Yo gros, toi-même tu sais.",
    	"Fais pas le con !",
    	"Merde ! Fais pas le con !",
    	"Faut pas exagérer quand même.",
    	"Ouaiiiis... nan, quand même pas.",
    ];

    const pages = [
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
    ];

    var intro = `
	face smile
	say Salut toi.
	face big-smile
	say Content de te voir ici !
	face standard
	say Je suis mini-Matthieu et je suis là pour t'aider dans ce sondage sur moi-même.
	face still
	say Tu vas devoir affronter treize questions de difficulté croissante pour prouver ta valeur.
	face standard
	say Tu ne devrais pas avoir trop de problème au début...
	face wink
	say Mais seuls ceux qui me connaissent sur le bout des doigts arriveront jusqu'à la fin !
	face big-smile
	say Montre-moi que tu es le meilleur de tous mes potes !
	face smile
	say C'est parti !
	startGame
`;

    var ending = `
	hide face
	fade darker
	wait 3900
	face very-disappointed
	show face

	wait 600
		say Je me sens... trahi.
		say Je pensais que tu valais mieux que ça.
	face disappointed
		say Tu me connais donc si mal ??
	face drama
		say Je savais que je ne méritais pas d'avoir un vrai pote.
		say Un pote qui me <b>*connaisse*</b>, putain.
		say Est-ce que c'est trop demander ?
		say Est-ce que je dois crier le nom de mon film préféré sur tous les toits...?
	face drama-2
		say Je pensais que <b>*toi*</b> tu serais celui qui... qui...
		say Mais tout ça, ce n'était que des mensonges !
		say Rien que des mensonges...
	face crying
		say Je suis tellement triste..!
		say À cause de toi !
	face crying-lot
		say Je suis le plus triste de la Terre !
		say Je me noie dans mes larmes ! Au secours ! Au sec...!
	face tears-bath
		say blbllblbllblbllblbb...
		say bllabaablblblaah...
		say bblblblaahha ! blalahahah !
	face got-you
		say Ahahah ! Je t'ai eu !
		say Tu as cru que j'étais vraiment triste, hein ?
	face bro
		say Aucun des deux films n'était mon préféré !
		say Tu étais obligé de te tromper !
	
	say
	face got-you-2
	wait 333
	face dancing
	wait 333
	face got-you
	wait 333
	face dancing-2
	wait 333

	face dancing
	wait 333
	face dancing-2
	wait 333
	face dancing
	wait 333
	face dancing-2
	wait 333

	face dab
	wait 800

	say Boum.
	
	face pole-dance-1
		say J'espère que tu ne m'en veux pas.
		say En vrai, tout ça c'est la faute de ces sondages Facebook et Instagram.
	face pole-dance-2
		say Ils m'affligeaient tellement, je devais faire quelque chose.
		say Et puis je sais bien que c'est toi le pote de ma vie.
		say Toi et personne d'autre.
	face pole-dance-1
		say Et après ma mort, quand je ressusciterai en escargot...
		say - parce que j'ai un mauvais karma -
		say ... tu ressusciteras aussi en escargot, juste à côté de moi.
	face pole-dance-2
		say Même si toi tu as un bon karma.
		say Parce que c'est ce que font les vrais potes.
	face pole-dance-1
		say Ce moment où tu te réveilles dans ton nouveau corps gluant...
		say ... avec une coquille sur le dos lourde comme un supplice grec...
		say ... que tu ouvres tes yeux télémétriques et que tu vois devant toi...
		say ... avec le même corps gluant et la même coquille sur le dos...
		say ... et toujours ce sourire con sur son visage de demeuré...
		say ... cette fameuse personne qui n'a jamais pu retenir le nom de ton film préféré...
		say ... à ce moment-là, tu sais qu'en face de toi...
	face pole-dance-2
		say ... c'est le pote de ta vie.
	face pole-dance-1
		say Et puis dans nos corps d'escargots on se coursera d'arbre en arbre...
		say ... on se fera des high-five avec les yeux...
		say ... et on crachera ensemble sur ces connasses de limaces.
	face pole-dance-2
		say Des trucs de potes quoi !

	fade
	face fly-on-bird
		say Bon.
		say J'espère que tu t'es bien amusé, pote de ma vie.
	rotate -20deg
		say Mais moi j'ai de la merde à gérer.
		say Et je suis sûr que toi aussi.
	translateX -50px
	translateY 30px
		say À très bientôt !
		say
	translateX 1000%
	wait 2000
	menu
`;

    var talkPositions = {
    	'disappointed': -18,
    	'very-disappointed': 17,
    	'angry': 60,
    	'drama': -10,
    	'drama-2': -7,
    	'crying': -6,
    	'crying-lot': 48,
    	'tears-bath': 3,
    	'got-you': -38,
    	'bro': -36,
    	'dancing': 0,
    	'dab': -66,
    	'pole-dance-1': 60,
    	'pole-dance-2': -74,
    	'fly-on-bird': 54,
    };

    const imagesToPreload = [
    	'bitmoji/face-standard.png',
    	'bitmoji/face-smile.png',
    	'bitmoji/face-big-smile.png',
    	'bitmoji/face-still.png',
    	'bitmoji/face-wink.png',
    	'bitmoji/face-super-cool.png',
    	'bitmoji/face-eye-right.png',
    	'bitmoji/face-eye-left.png',
    	'bitmoji/face-angry.png',
    	'bitmoji/face-slightly-mad.png',
    	'bitmoji/face-happiest.png',
    	'bitmoji/face-crying.png',
    	'bitmoji/face-crying-lot.png',
    	'bitmoji/face-laugh-with-tears.png',
    	'bitmoji/face-tear.png',
    	'bitmoji/face-gosh.png',

    	'img/height-1.png',
    	'img/height-2.png',
    	'img/height-3.png',
    	'img/teeth-1.png',
    	'img/teeth-2.png',
    	'img/teeth-3.png',
    	'img/teeth-4.png',
    	'img/baby-3.png',
    	'img/crocodile.png',
    	'img/guepard.png',
    	'img/plane.png',
    	'img/boulangerie.png',
    	'img/good-food.png',
    	'img/caca.png',

    	'bitmoji/full-very-disappointed.png',
    	'bitmoji/full-disappointed.png',
    	'bitmoji/full-drama.png',
    	'bitmoji/full-drama-2.png',
    	'bitmoji/full-crying.png',
    	'bitmoji/full-crying-lot.png',
    	'bitmoji/full-tears-bath.png',
    	'bitmoji/full-got-you.png',
    	'bitmoji/full-got-you-2.png',
    	'bitmoji/full-bro.png',
    	'bitmoji/full-dancing.png',
    	'bitmoji/full-dancing-2.png',
    	'bitmoji/full-dab.png',
    	'bitmoji/full-pole-dance-1.png',
    	'bitmoji/full-pole-dance-2.png',
    	'bitmoji/full-fly-on-bird.png',
    ]; 

    function preloadImages() {
    	for (let img of imagesToPreload)
    		(new Image).src = img;
    }

    /* src/App.svelte generated by Svelte v3.20.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	child_ctx[34] = i;
    	return child_ctx;
    }

    // (95:27) 
    function create_if_block_5(ctx) {
    	let div3;
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let div1_style_value;
    	let div2_style_value;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			attr_dev(img, "id", "story-bitmoji-img");
    			if (img.src !== (img_src_value = `bitmoji/full-${/*face*/ ctx[4]}.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-x7wrfo");
    			add_location(img, file, 103, 3, 2193);
    			attr_dev(div0, "id", "story-bitmoji-talk");
    			attr_dev(div0, "class", "svelte-x7wrfo");
    			add_location(div0, file, 104, 3, 2265);
    			attr_dev(div1, "id", "story-triangle-talk");
    			attr_dev(div1, "style", div1_style_value = `margin-left: ${/*trianglePosition*/ ctx[8]}px;`);
    			attr_dev(div1, "class", "svelte-x7wrfo");
    			add_location(div1, file, 105, 3, 2315);
    			attr_dev(div2, "id", "story-bitmoji");
    			attr_dev(div2, "show", /*showFace*/ ctx[9]);
    			attr_dev(div2, "animation", /*animation*/ ctx[10]);
    			attr_dev(div2, "style", div2_style_value = `transform: scaleX(${/*scaleX*/ ctx[11]}) scaleX(${/*scaleY*/ ctx[12]}) rotate(${/*rotate*/ ctx[13]}) translateX(${/*translateX*/ ctx[14]}) translateY(${/*translateY*/ ctx[15]})`);
    			attr_dev(div2, "class", "svelte-x7wrfo");
    			add_location(div2, file, 97, 2, 1995);
    			attr_dev(div3, "id", "story");
    			attr_dev(div3, "class", "svelte-x7wrfo");
    			add_location(div3, file, 96, 1, 1976);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			div0.innerHTML = /*say*/ ctx[5];
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*face*/ 16 && img.src !== (img_src_value = `bitmoji/full-${/*face*/ ctx[4]}.png`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*say*/ 32) div0.innerHTML = /*say*/ ctx[5];
    			if (dirty[0] & /*trianglePosition*/ 256 && div1_style_value !== (div1_style_value = `margin-left: ${/*trianglePosition*/ ctx[8]}px;`)) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (dirty[0] & /*showFace*/ 512) {
    				attr_dev(div2, "show", /*showFace*/ ctx[9]);
    			}

    			if (dirty[0] & /*animation*/ 1024) {
    				attr_dev(div2, "animation", /*animation*/ ctx[10]);
    			}

    			if (dirty[0] & /*scaleX, scaleY, rotate, translateX, translateY*/ 63488 && div2_style_value !== (div2_style_value = `transform: scaleX(${/*scaleX*/ ctx[11]}) scaleX(${/*scaleY*/ ctx[12]}) rotate(${/*rotate*/ ctx[13]}) translateX(${/*translateX*/ ctx[14]}) translateY(${/*translateY*/ ctx[15]})`)) {
    				attr_dev(div2, "style", div2_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(95:27) ",
    		ctx
    	});

    	return block;
    }

    // (48:26) 
    function create_if_block_3(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let t0;
    	let t1_value = /*step*/ ctx[3] + 1 + "";
    	let t1;
    	let t2;
    	let t3_value = pages.length + "";
    	let t3;
    	let t4;
    	let header;
    	let t5_value = /*page*/ ctx[6].ask + "";
    	let t5;
    	let header_class_value;
    	let t6;
    	let main;
    	let main_display_value;
    	let t7;
    	let footer;
    	let div2;
    	let img;
    	let img_src_value;
    	let t8;
    	let div3;
    	let footer_furtive_value;
    	let each_value = /*page*/ ctx[6].answers;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("\t\n\t\tQuestion ");
    			t1 = text(t1_value);
    			t2 = text(" / ");
    			t3 = text(t3_value);
    			t4 = space();
    			header = element("header");
    			t5 = text(t5_value);
    			t6 = space();
    			main = element("main");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			footer = element("footer");
    			div2 = element("div");
    			img = element("img");
    			t8 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "filler svelte-x7wrfo");
    			attr_dev(div0, "style", div0_style_value = `width: ${100 * (/*step*/ ctx[3] + 1) / pages.length}%`);
    			add_location(div0, file, 50, 2, 1080);
    			attr_dev(div1, "id", "progress-bar");
    			attr_dev(div1, "class", "svelte-x7wrfo");
    			add_location(div1, file, 49, 1, 1054);
    			attr_dev(header, "id", "header");
    			attr_dev(header, "class", header_class_value = "" + (null_to_empty("animated " + /*headerAnimation*/ ctx[7]) + " svelte-x7wrfo"));
    			add_location(header, file, 57, 1, 1212);
    			attr_dev(main, "id", "main");
    			attr_dev(main, "class", "animated bounceInRight svelte-x7wrfo");
    			attr_dev(main, "display", main_display_value = /*page*/ ctx[6].display || "text");
    			add_location(main, file, 64, 1, 1305);
    			if (img.src !== (img_src_value = `bitmoji/face-${/*face*/ ctx[4]}.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "width", "140px");
    			add_location(img, file, 87, 3, 1820);
    			attr_dev(div2, "id", "bitmoji");
    			add_location(div2, file, 86, 2, 1798);
    			attr_dev(div3, "id", "bitmoji-talk");
    			attr_dev(div3, "class", "svelte-x7wrfo");
    			add_location(div3, file, 90, 2, 1892);
    			attr_dev(footer, "id", "footer");
    			attr_dev(footer, "furtive", footer_furtive_value = !/*say*/ ctx[5]);
    			attr_dev(footer, "class", "animated bounceInUp svelte-x7wrfo");
    			add_location(footer, file, 85, 1, 1732);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, header, anchor);
    			append_dev(header, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			insert_dev(target, t7, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div2);
    			append_dev(div2, img);
    			append_dev(footer, t8);
    			append_dev(footer, div3);
    			div3.innerHTML = /*say*/ ctx[5];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*step*/ 8 && div0_style_value !== (div0_style_value = `width: ${100 * (/*step*/ ctx[3] + 1) / pages.length}%`)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty[0] & /*step*/ 8 && t1_value !== (t1_value = /*step*/ ctx[3] + 1 + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*page*/ 64 && t5_value !== (t5_value = /*page*/ ctx[6].ask + "")) set_data_dev(t5, t5_value);

    			if (dirty[0] & /*headerAnimation*/ 128 && header_class_value !== (header_class_value = "" + (null_to_empty("animated " + /*headerAnimation*/ ctx[7]) + " svelte-x7wrfo"))) {
    				attr_dev(header, "class", header_class_value);
    			}

    			if (dirty[0] & /*page, clickAnswer*/ 131136) {
    				each_value = /*page*/ ctx[6].answers;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*page*/ 64 && main_display_value !== (main_display_value = /*page*/ ctx[6].display || "text")) {
    				attr_dev(main, "display", main_display_value);
    			}

    			if (dirty[0] & /*face*/ 16 && img.src !== (img_src_value = `bitmoji/face-${/*face*/ ctx[4]}.png`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*say*/ 32) div3.innerHTML = /*say*/ ctx[5];
    			if (dirty[0] & /*say*/ 32 && footer_furtive_value !== (footer_furtive_value = !/*say*/ ctx[5])) {
    				attr_dev(footer, "furtive", footer_furtive_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(48:26) ",
    		ctx
    	});

    	return block;
    }

    // (38:27) 
    function create_if_block_2(ctx) {
    	let footer;
    	let div0;
    	let img;
    	let img_src_value;
    	let t;
    	let div1;
    	let footer_furtive_value;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div0 = element("div");
    			img = element("img");
    			t = space();
    			div1 = element("div");
    			if (img.src !== (img_src_value = `bitmoji/face-${/*face*/ ctx[4]}.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "width", "140px");
    			add_location(img, file, 41, 3, 900);
    			attr_dev(div0, "id", "bitmoji");
    			add_location(div0, file, 40, 2, 878);
    			attr_dev(div1, "id", "bitmoji-talk");
    			attr_dev(div1, "class", "svelte-x7wrfo");
    			add_location(div1, file, 44, 2, 972);
    			attr_dev(footer, "id", "footer");
    			attr_dev(footer, "furtive", footer_furtive_value = !/*say*/ ctx[5]);
    			attr_dev(footer, "class", "animated bounceInUp svelte-x7wrfo");
    			add_location(footer, file, 39, 1, 812);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div0);
    			append_dev(div0, img);
    			append_dev(footer, t);
    			append_dev(footer, div1);
    			div1.innerHTML = /*say*/ ctx[5];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*face*/ 16 && img.src !== (img_src_value = `bitmoji/face-${/*face*/ ctx[4]}.png`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*say*/ 32) div1.innerHTML = /*say*/ ctx[5];
    			if (dirty[0] & /*say*/ 32 && footer_furtive_value !== (footer_furtive_value = !/*say*/ ctx[5])) {
    				attr_dev(footer, "furtive", footer_furtive_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(38:27) ",
    		ctx
    	});

    	return block;
    }

    // (3:0) {#if stage == "menu"}
    function create_if_block(ctx) {
    	let h1;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div2;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div3;
    	let button;
    	let t7;
    	let t8;
    	let img2;
    	let img2_src_value;
    	let dispose;
    	let if_block = document.body.parentElement.requestFullscreen && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			img0 = element("img");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Do you know";
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "Matthieu?";
    			t4 = space();
    			img1 = element("img");
    			t5 = space();
    			div3 = element("div");
    			button = element("button");
    			button.textContent = "Commencer";
    			t7 = space();
    			if (if_block) if_block.c();
    			t8 = space();
    			img2 = element("img");
    			attr_dev(img0, "id", "angel");
    			if (img0.src !== (img0_src_value = "bitmoji/full-angel.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "height", "104px");
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "svelte-x7wrfo");
    			add_location(img0, file, 5, 2, 70);
    			attr_dev(div0, "class", "animated bounceInDown svelte-x7wrfo");
    			add_location(div0, file, 7, 3, 161);
    			attr_dev(div1, "id", "matthieu");
    			attr_dev(div1, "class", "animated bounceInUp svelte-x7wrfo");
    			add_location(div1, file, 8, 3, 217);
    			attr_dev(div2, "id", "title");
    			attr_dev(div2, "class", "svelte-x7wrfo");
    			add_location(div2, file, 6, 2, 141);
    			attr_dev(img1, "id", "demon");
    			if (img1.src !== (img1_src_value = "bitmoji/full-demon.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "height", "104px");
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "svelte-x7wrfo");
    			add_location(img1, file, 10, 2, 291);
    			attr_dev(h1, "class", "svelte-x7wrfo");
    			add_location(h1, file, 4, 1, 63);
    			attr_dev(button, "id", "start");
    			attr_dev(button, "class", "game-music svelte-x7wrfo");
    			add_location(button, file, 14, 2, 386);
    			attr_dev(div3, "id", "menu");
    			attr_dev(div3, "class", "svelte-x7wrfo");
    			add_location(div3, file, 13, 1, 368);
    			attr_dev(img2, "id", "resting");
    			if (img2.src !== (img2_src_value = "bitmoji/full-read-with-cat.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "width", "180px");
    			attr_dev(img2, "alt", "");
    			attr_dev(img2, "class", "svelte-x7wrfo");
    			add_location(img2, file, 34, 1, 703);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, img0);
    			append_dev(h1, t0);
    			append_dev(h1, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(h1, t4);
    			append_dev(h1, img1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, button);
    			append_dev(div3, t7);
    			if (if_block) if_block.m(div3, null);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, img2, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*startIntro*/ ctx[18], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (document.body.parentElement.requestFullscreen) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(img2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(3:0) {#if stage == \\\"menu\\\"}",
    		ctx
    	});

    	return block;
    }

    // (77:4) {:else}
    function create_else_block(ctx) {
    	let span;
    	let t_value = letters[/*index*/ ctx[34]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "index-letter svelte-x7wrfo");
    			add_location(span, file, 77, 5, 1617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(77:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (75:4) {#if page.display == 'image'}
    function create_if_block_4(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*answer*/ ctx[32].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-x7wrfo");
    			add_location(img, file, 75, 5, 1568);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*page*/ 64 && img.src !== (img_src_value = /*answer*/ ctx[32].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(75:4) {#if page.display == 'image'}",
    		ctx
    	});

    	return block;
    }

    // (70:2) {#each page.answers as answer, index}
    function create_each_block(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*answer*/ ctx[32].value + "";
    	let t1;
    	let t2;
    	let button_status_value;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*page*/ ctx[6].display == "image") return create_if_block_4;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(button, "status", button_status_value = /*answer*/ ctx[32].status || "");
    			attr_dev(button, "class", "svelte-x7wrfo");
    			add_location(button, file, 70, 3, 1437);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);
    			if (remount) dispose();

    			dispose = listen_dev(
    				button,
    				"click",
    				function () {
    					if (is_function(/*clickAnswer*/ ctx[17].bind(this, /*answer*/ ctx[32]))) /*clickAnswer*/ ctx[17].bind(this, /*answer*/ ctx[32]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, t0);
    				}
    			}

    			if (dirty[0] & /*page*/ 64 && t1_value !== (t1_value = /*answer*/ ctx[32].value + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*page*/ 64 && button_status_value !== (button_status_value = /*answer*/ ctx[32].status || "")) {
    				attr_dev(button, "status", button_status_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(70:2) {#each page.answers as answer, index}",
    		ctx
    	});

    	return block;
    }

    // (23:2) {#if document.body.parentElement.requestFullscreen}
    function create_if_block_1(ctx) {
    	let button;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Plein ecran");
    			attr_dev(button, "id", "fullscreen");
    			attr_dev(button, "class", "game-music");
    			attr_dev(button, "pushed", /*isFullScreen*/ ctx[2]);
    			add_location(button, file, 23, 3, 542);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*toggleFullScreen*/ ctx[16], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*isFullScreen*/ 4) {
    				attr_dev(button, "pushed", /*isFullScreen*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(23:2) {#if document.body.parentElement.requestFullscreen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*stage*/ ctx[0] == "menu") return create_if_block;
    		if (/*stage*/ ctx[0] == "intro") return create_if_block_2;
    		if (/*stage*/ ctx[0] == "game") return create_if_block_3;
    		if (/*stage*/ ctx[0] == "story") return create_if_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div, "id", "fader");
    			attr_dev(div, "status", /*fader*/ ctx[1]);
    			attr_dev(div, "class", "svelte-x7wrfo");
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*fader*/ 2) {
    				attr_dev(div, "status", /*fader*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t);

    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function random(x) {
    	if (typeof x == "number") return Math.floor(Math.random() * x);
    	if (Array.isArray(x)) return x[Math.floor(Math.random() * x.length)];
    }

    function instance($$self, $$props, $$invalidate) {
    	const stories = { ending };
    	const wrongFaces = ["still", "standard", "perplexe", "thinking", "you-sure"];

    	const butAlso = [
    		"Mais ce n'est pas tout...",
    		"Mais il y a aussi...",
    		"Mais ne laissons pas de côté..."
    	];

    	const headerAnimations = ["wobble", "tada", "heartBeat"];
    	let stage = "menu";
    	let fader = "";
    	let isFullScreen = !!document.fullscreenElement;
    	let step = -1;
    	let face = "standard";
    	let say = "";
    	let hasAnswered = false;
    	let totalCurrentAnswers = 0;
    	let page = null;
    	let actionCallbackId = 0;
    	let headerAnimation = "bounceInDown";
    	let speakDirection = "right";
    	let trianglePosition = 0;
    	let showFace = true;
    	let animation = "";
    	let scaleX = 1;
    	let scaleY = 1;
    	let rotate = 0;
    	let translateX = 0;
    	let translateY = 0;
    	preloadImages();

    	const actions = new (class extends Array {
    		// parse commands then add them
    		execute(commands) {
    			commands = commands.trim().split("\n").map(e => e.trim()).filter(i => i).map(e => {
    				let index = e.indexOf(" ");
    				if (index == -1) return [e];
    				return [e.slice(0, index).trim(), e.slice(index).trim()];
    			});

    			this.do(...commands);
    		}

    		// prepare to execute the next action
    		ready(timeout = 0) {
    			if (actionCallbackId) return;
    			actionCallbackId = setTimeout(this.run.bind(this), timeout);
    		}

    		// execute the next action
    		run() {
    			actionCallbackId = 0;
    			const action = this.shift();
    			if (!action) return;

    			if (typeof action == "function") {
    				action();
    				this.ready();
    			} else {
    				const [command, argument] = action;

    				switch (command) {
    					case "face":
    						$$invalidate(4, face = argument || "standard");
    						if (stage == "story") $$invalidate(8, trianglePosition = talkPositions[face] || 0);
    						this.run();
    						break;
    					case "say":
    						$$invalidate(5, say = argument || "");
    						if (!say) this.run();
    						break;
    					case "fade":
    						$$invalidate(1, fader = argument || "hidden");
    						this.ready();
    						break;
    					case "hide":
    						if (argument == "face") $$invalidate(9, showFace = false);
    						this.run();
    						break;
    					case "show":
    						if (argument == "face") $$invalidate(9, showFace = true);
    						this.run();
    						break;
    					case "reset":
    						$$invalidate(4, face = "standard");
    						$$invalidate(5, say = "");
    						this.run();
    						break;
    					case "next":
    						next();
    						this.ready();
    						break;
    					case "scaleX":
    						$$invalidate(11, scaleX = argument || 1);
    						this.run();
    						break;
    					case "scaleY":
    						$$invalidate(12, scaleY = argument || 1);
    						this.run();
    						break;
    					case "rotate":
    						$$invalidate(13, rotate = argument || "");
    						this.run();
    						break;
    					case "translateX":
    						$$invalidate(14, translateX = argument || "");
    						this.run();
    						break;
    					case "translateY":
    						$$invalidate(15, translateY = argument || "");
    						this.run();
    						break;
    					case "animate":
    						$$invalidate(10, animation = argument || "");
    						this.run();
    						break;
    					case "wait":
    						this.ready(+argument || 0);
    						break;
    					case "story":
    						$$invalidate(0, stage = "story");
    						actions.length = 0;
    						actions.execute(stories[argument]);
    						break;
    					case "menu":
    						$$invalidate(0, stage = "menu");
    						actions.length = 0;
    						removeEventListener("click", nextActionOnClick);
    						$$invalidate(9, showFace = true);
    						$$invalidate(10, animation = "");
    						$$invalidate(11, scaleX = 1);
    						$$invalidate(12, scaleY = 1);
    						$$invalidate(13, rotate = 0);
    						$$invalidate(14, translateX = 0);
    						$$invalidate(15, translateY = 0);
    						break;
    					case "startGame":
    						startGame();
    						break;
    					default:
    						console.warn(`Unknow command : ${command}`);
    						this.run();
    				}
    			}
    		}

    		// add action(s)
    		do() {
    			let shouldRun = this.length == 0;
    			this.push.apply(this, arguments);
    			if (shouldRun) this.ready();
    		}
    	})();

    	function toggleFullScreen() {
    		if (document.fullscreenElement) {
    			document.exitFullscreen();
    			$$invalidate(2, isFullScreen = false);
    		} else {
    			document.body.parentElement.requestFullscreen();
    			$$invalidate(2, isFullScreen = true);
    		}
    	}

    	function next() {
    		totalCurrentAnswers = 0;
    		$$invalidate(3, step++, step);
    		if (step > pages.length) return;
    		$$invalidate(6, page = pages[step]);
    		if (step) $$invalidate(7, headerAnimation = headerAnimations[step % headerAnimations.length]);

    		for (let node of document.querySelectorAll("#main > button")) {
    			node.setAttribute("status", "");
    		}

    		if (page.intro) actions.execute(page.intro); else resetBitmoji();
    	}

    	function clickAnswer(answer) {
    		const requestedAnswers = page.requestedAnswers || 1;
    		if (totalCurrentAnswers >= requestedAnswers) return;

    		if (answer.valid === undefined) {
    			actions.execute(answer.action || `
				face ${random(wrongFaces)}
				say ${random(wrongs)}
			`);

    			return;
    		}

    		totalCurrentAnswers++;
    		this.setAttribute("status", "checking");

    		setTimeout(
    			() => {
    				this.setAttribute("status", answer.valid ? "right" : "wrong");
    				actions.length = 0; // we remove the remaining actions
    				if (answer.action) actions.execute(answer.action);

    				if (totalCurrentAnswers >= requestedAnswers) {
    					if (page.outro) actions.execute(page.outro);
    					actions.do(next);
    				} else {
    					actions.execute(`
					face
					say ${random(butAlso)}
				`);
    				}
    			},
    			750
    		);
    	}

    	function resetBitmoji() {
    		if (!actionCallbackId && !actions.length) actions.do(["face"], ["say"]);
    	}

    	function startIntro() {
    		$$invalidate(0, stage = "intro");
    		actions.execute(intro);

    		setTimeout(
    			() => {
    				addEventListener("click", nextActionOnClick);
    			},
    			0
    		);
    	}

    	function nextActionOnClick() {
    		resetBitmoji();
    		actions.ready();
    	}

    	function startGame() {
    		$$invalidate(0, stage = "game");
    		$$invalidate(3, step = -1);
    		next();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		wrongs,
    		pages,
    		intro,
    		ending,
    		talkPositions,
    		preloadImages,
    		stories,
    		letters,
    		wrongFaces,
    		butAlso,
    		headerAnimations,
    		stage,
    		fader,
    		isFullScreen,
    		step,
    		face,
    		say,
    		hasAnswered,
    		totalCurrentAnswers,
    		page,
    		actionCallbackId,
    		headerAnimation,
    		speakDirection,
    		trianglePosition,
    		showFace,
    		animation,
    		scaleX,
    		scaleY,
    		rotate,
    		translateX,
    		translateY,
    		random,
    		actions,
    		toggleFullScreen,
    		next,
    		clickAnswer,
    		resetBitmoji,
    		startIntro,
    		nextActionOnClick,
    		startGame
    	});

    	$$self.$inject_state = $$props => {
    		if ("stage" in $$props) $$invalidate(0, stage = $$props.stage);
    		if ("fader" in $$props) $$invalidate(1, fader = $$props.fader);
    		if ("isFullScreen" in $$props) $$invalidate(2, isFullScreen = $$props.isFullScreen);
    		if ("step" in $$props) $$invalidate(3, step = $$props.step);
    		if ("face" in $$props) $$invalidate(4, face = $$props.face);
    		if ("say" in $$props) $$invalidate(5, say = $$props.say);
    		if ("hasAnswered" in $$props) hasAnswered = $$props.hasAnswered;
    		if ("totalCurrentAnswers" in $$props) totalCurrentAnswers = $$props.totalCurrentAnswers;
    		if ("page" in $$props) $$invalidate(6, page = $$props.page);
    		if ("actionCallbackId" in $$props) actionCallbackId = $$props.actionCallbackId;
    		if ("headerAnimation" in $$props) $$invalidate(7, headerAnimation = $$props.headerAnimation);
    		if ("speakDirection" in $$props) speakDirection = $$props.speakDirection;
    		if ("trianglePosition" in $$props) $$invalidate(8, trianglePosition = $$props.trianglePosition);
    		if ("showFace" in $$props) $$invalidate(9, showFace = $$props.showFace);
    		if ("animation" in $$props) $$invalidate(10, animation = $$props.animation);
    		if ("scaleX" in $$props) $$invalidate(11, scaleX = $$props.scaleX);
    		if ("scaleY" in $$props) $$invalidate(12, scaleY = $$props.scaleY);
    		if ("rotate" in $$props) $$invalidate(13, rotate = $$props.rotate);
    		if ("translateX" in $$props) $$invalidate(14, translateX = $$props.translateX);
    		if ("translateY" in $$props) $$invalidate(15, translateY = $$props.translateY);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		stage,
    		fader,
    		isFullScreen,
    		step,
    		face,
    		say,
    		page,
    		headerAnimation,
    		trianglePosition,
    		showFace,
    		animation,
    		scaleX,
    		scaleY,
    		rotate,
    		translateX,
    		translateY,
    		toggleFullScreen,
    		clickAnswer,
    		startIntro
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
