const k = require('kolmafia')
Object.assign(globalThis, k);

function replaceElements(input) {
	return input
	.replace("<font color=blue>Cold Damage</font>", "{{element|Cold}}")
	.replace("<font color=gray>Spooky Damage</font>", "{{element|Spooky}}")
	.replace("<font color=green>Stench Damage</font>", "{{element|Stench}}")
	.replace("<font color=red>Hot Damage</font>", "{{element|Hot}}")
	.replace("<font color=blueviolet>Sleaze Damage</font>", "{{element|Sleaze}}")
	.replace("<font color=blue>Cold Spells</font>", "{{element|Cold|Spells}}")
	.replace("<font color=gray>Spooky Spells</font>", "{{element|Spooky|Spells}}")
	.replace("<font color=green>Stench Spells</font>", "{{element|Stench|Spells}}")
	.replace("<font color=red>Hot Spells</font>", "{{element|Hot|Spells}}")
	.replace("<font color=blueviolet>Sleaze Spells</font>", "{{element|Sleaze|Spells}}")
}

function replaceImage(image) {
	if (image === 'nopic.gif') {
		return 'nopic2.gif'
	}
	return image;
}

function makeTemplate(name, map, includeNewlines) {
	const n = includeNewlines ? '\n' : '';
	let t = '{{' + name;
	for (let [k, v] of map) {
		t += `${n}|` + k + '=' + v;
	}
	t += n + '}}'
	return t;
}

function skill(id) {
	var sk = Skill.get(id);
	var page = visitUrl("desc_skill.php?whichskill=" + sk.id);
	var desc = page.match('<blockquote class=small>([^]+)</blockquote>')
	if (desc && desc.length > 1) {
		desc = desc[1]
	} else {
		desc = ''
	}
	var effect = page.match("<center><font color=blue size=2><b>([^]+?)</b></font></center>");
	if (effect && effect.length > 1) {
		effect = effect[1]
	} else {
		effect = ""
	}
	var type = ""
	if (sk.passive) {
		type = "Passive"
	} else if (sk.buff) {
		type = "Buff"
	} else if (sk.combat) {
		if (sk.spell) {
			type = "Combat Spell"
		} else {
			type = "Combat"
		}
	} else {
		type = "Noncombat";
	}
	
	var data_link = `https://kol.coldfront.net/thekolwiki/index.php?title=Data:${urlEncode(sk.name)}&action=edit`;
	printHtml(`<a href="${data_link}">${data_link}</a>`)
	print();
	var text = `<includeonly>{{{{{format}}}|
	name=${sk.name}|
	image=${replaceImage(sk.image)}|
	{{{1|}}}}}</includeonly><noinclude>{{{{FULLPAGENAME}}|format=skill/meta}}</noinclude>`
	printHtml(text.replace(/</g, '&lt;'));
	print();
	
	var link = `https://kol.coldfront.net/thekolwiki/index.php?title=${urlEncode(sk.name)}&action=edit`
	printHtml(`<a href="${link}">${link}</a>`)
	print();
	var text = `{{skill
	|skillid=${id}
	|description=${desc}${effect != '' ? `
	|effect=${effect}` : ''}
	|type=${type}
	|mpcost=0
	|permable=0
	|once=day
	|source=[[AAAAAAAAAA]]
	|explain=
	|usemsg=
	}}`
	printHtml(text.replace(/</g, '&lt;'));
	print();
}

function itemObtainedFrom(it) {
	// which monsters drop this?
	const monsters = Monster.all().filter(m => itemDropsArray(m).some(x => x.drop == it))
	if (monsters.length > 0) {
		let ret = "";
		// and where do we find them?
		for (let monster of monsters) {
			const locations = Location.all().filter(x => Object.keys(getLocationMonsters(x)).some(x => x == monster.name))
			for (let location of locations) {
				ret += `;[[${location}]]\n:[[${monster}]]\n`
			}
		}
		if (ret.endsWith('\n')) ret = ret.slice(0, -1)
		return ret;
	}
	return ";[[AAAAAAAAAAA]]\n:[[AAAAAAAAAA]]"
}

function item(id) {
	var it = Item.get(id);
	var page = visitUrl("desc_item.php?whichitem=" + it.descid);
	var desc = page.match("<blockquote>([^]+)<!-- itemid:");
	if (desc && desc.length > 1) {
		desc = desc[1]
	} else {
		print("Failed to find description");
		print(page)
		return;
	}
	var effect = page.match("<center><b><font color=blue>(.+?)</font></b></center>");
	if (effect && effect.length > 1) {
		effect = effect[1]
	} else {
		print("Failed to find effect");
		print(page)
		effect = ""
	}
	
	var data_link = `https://kol.coldfront.net/thekolwiki/index.php?title=Data:${urlEncode(it.name)}&action=edit`;
	printHtml(`<a href="${data_link}">${data_link}</a>`)
	print();
	var text = `<includeonly>{{{{{format}}}|
	name=${it.name}|
	plural=${it.plural}|
	image=${replaceImage(it.image)}|
	{{{1|}}}}}</includeonly><noinclude>{{{{FULLPAGENAME}}|format=item/meta}}</noinclude>`
	printHtml(text.replace(/</g, '&lt;'));
	print();
	
	var link = `https://kol.coldfront.net/thekolwiki/index.php?title=${urlEncode(it.name)}&action=edit`
	printHtml(`<a href="${link}">${link}</a>`)
	print();
	var props = new Map();
	var usableProps = new Map();
	let usable = it.usable;
	props.set('itemid', id);
	props.set('descid', it.descid);
	props.set('desc', desc);
	// this doesn't match food or booze, for which we use mafia's type
	const typeMatch = page.match('<br>Type: <b>([^<]+)</b>(</b>)?<[Bb]r>')
	const mafiaType = itemType(it);
	const type = typeMatch && typeMatch.length > 1 ? typeMatch[1] : mafiaType
	if (type != '') {
		props.set('type', type);
	}
	if (it.skill != Skill.get("none")) {
		props.set('skill', it.skill.name)
	}
	if (getPower(it) != 0) {
		props.set('power', getPower(it))
	}
	if (type.startsWith("weapon") || type.startsWith("ranged weapon")) {
		props.set('powertype', 'Damage')
	}
	if (type == 'off-hand item (shield)') {
		const dr = numericModifier(it, Modifier.get("Damage Reduction"));
		props.set('power', dr);
		props.set('powertype', 'Damage Reduction');
	}
	if (type == 'food') {
		usable = true;
		props.set('quality', it.quality || '!')
		props.set('size', it.fullness)
		if (it.levelreq != 1) {
			props.set('level', it.levelreq)
		}
		usableProps.set('type', 'food')
		usableProps.set('limiter', it.fullness)
	}
	if (type == 'booze') {
		usable = true;
		props.set('quality', it.quality || '!')
		props.set('size', it.inebriety)
		if (it.levelreq != 1) {
			props.set('level', it.levelreq)
		}
		usableProps.set('type', 'booze')
		usableProps.set('limiter', it.inebriety)
	}
	if (type == 'spleen item') {
		props.set('quality', it.quality || '!')
		props.set('toxicity', it.spleen)
		if (it.levelreq != 1) {
			props.set('level', it.levelreq)
		}
		usableProps.set('type', 'spleen')
		usableProps.set('limiter', it.spleen)
	}
	if (type.startsWith('combat item')) {
		usable = true
		usableProps.set('type', 'combat')
	}
	if (!it.tradeable) {
		props.set('notrade', 1);
	}
	if (it.discardable) {
		props.set('autosell', autosellPrice(it));
	} else {
		props.set('autosell', 0)
	}
	if (booleanModifier(it, Modifier.get('Lasts Until Rollover'))) {
		props.set('eod', 1)
	} else if (it.quest) {
		props.set('quest', 1)
	}
	if (it.pasteable) {
		props.set('paste', 1)
	}
	if (it.cookable) {
		props.set('cook', 1)
	}
	if (it.mixable) {
		props.set('cocktail', 1)
	}
	if (booleanModifier(it, Modifier.get('Single Equip'))) {
		props.set('limit', 1)
	}
	if (effect != '') {
		props.set('enchantment', replaceElements(effect).replace(/<br>$/, ''));
	}
	const potEffect = stringModifier(it, Modifier.get("Effect"));
	if (potEffect != "") {
		props.set('effect', potEffect)
		const duration = numericModifier(it, Modifier.get("Effect Duration"));
		props.set('duration', duration)
		var eff = (type == 'food' || type == 'booze' || type == 'spleen item') ? 'posteffect' : 'effect'
		usableProps.set(eff, makeTemplate('acquireEffect', new Map([['effect', potEffect], ['duration', duration]]), false))
	}
	if (usable) {
		usableProps.set('text', '{{NeedsText}}')
	}
	var text = makeTemplate('item', props, true) + `

	==Obtained From==
	${itemObtainedFrom(it)}${usable ? `

	==When Used==
	${makeTemplate('useitem', usableProps, false)}` : ''}

	==Collection==
	<collection>${id}</collection>`
	printHtml(text.replace(/</g, '&lt;'));
	print();
}

function effect(id) {
	var eff = Effect.get(id);
	var page = visitUrl("desc_effect.php?whicheffect=" + eff.descid);
	var desc = page.match("<blockquote>([^]+)</blockquote>");
	if (desc && desc.length > 1) {
		desc = desc[1]
	} else {
		print("Failed to find description");
		print(page)
		return;
	}
	var effect = page.match("<font color=blue><b>(.+?)</b></font>");
	if (effect && effect.length > 1) {
		effect = effect[1]
	} else {
		print("Failed to find effect");
		print(page)
		effect = ""
	}
	
	var data_link = `https://kol.coldfront.net/thekolwiki/index.php?title=Data:${urlEncode(eff.name)}&action=edit`;
	printHtml(`<a href="${data_link}">${data_link}</a>`)
	print();
	var text = `<includeonly>{{{{{format}}}|
	name=${eff.name}|
	image=${replaceImage(eff.image)}|
	effect=${replaceElements(effect)}|
	{{{1|}}}}}</includeonly><noinclude>{{{{FULLPAGENAME}}|format=effect/meta}}</noinclude>`
	printHtml(text.replace(/</g, '&lt;'));
	print();

	var obtain = Item.all().filter(x => effectModifier(x, Modifier.get("Effect")) == eff);
	
	var link = `https://kol.coldfront.net/thekolwiki/index.php?title=${urlEncode(eff.name)}&action=edit`
	printHtml(`<a href="${link}">${link}</a>`)
	print();
	var text = `{{effect
	|effectid=${id}
	|descid=${eff.descid}
	|desc=${desc}
	}}
	
	==Obtained From==
	${obtain.length > 0 ? obtain.map(x => `*[[${x.name}]] (${toInt(numericModifier(x, Modifier.get("Effect Duration")))} Adventures)`).join('<br>') : "*[[AAAAAAAAAAA]] (X Adventures)"}`
	printHtml(text.replace(/</g, '&lt;'));
	print();
}

function main(args) {
	[type, id] = args.split(" ");
	if (type == "effect") {
		effect(id);
	} else if (type == "item") {
		item(id)
	} else if (type == "skill") {
		skill(id)
	} else {
		print("unknown type");
	}
}

module.exports.main = main
