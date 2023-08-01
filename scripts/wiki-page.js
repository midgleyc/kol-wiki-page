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

function skill(id) {
	var sk = Skill.get(id);
	var page = visitUrl("desc_skill.php?whichskill=" + sk.id);
	
	var data_link = `https://kol.coldfront.net/thekolwiki/index.php?title=Data:${urlEncode(sk.name)}&action=edit`;
	printHtml(`<a href="${data_link}">${data_link}</a>`)
	print();
	var text = `<includeonly>{{{{{format}}}|
	name=${sk.name}|
	image=${sk.image}|
	{{{1|}}}}}</includeonly><noinclude>{{{{FULLPAGENAME}}|format=skill/meta}}</noinclude>`
	printHtml(text.replace(/</g, '&lt;'));
	print();
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
	plural=?|
	image=${it.image}|
	{{{1|}}}}}</includeonly><noinclude>{{{{FULLPAGENAME}}|format=item/meta}}</noinclude>`
	printHtml(text.replace(/</g, '&lt;'));
	print();
	
	var link = `https://kol.coldfront.net/thekolwiki/index.php?title=${urlEncode(it.name)}&action=edit`
	printHtml(`<a href="${link}">${link}</a>`)
	print();
	var text = `{{item
	|itemid=${id}
	|descid=${it.descid}
	|desc=${desc}
	|type=usable
	|notrade=1
	|autosell=0
	|quest=1
	${effect != "" ? `|enchantment=${replaceElements(effect)}` : ""}}}

	==Obtained From==
	;Stores
	:[[Replica Mr. Store]] (1 [[replica Mr. Accessory]])

	==Notes==
	*{{IsTheSameAs|otheritem=${it.name.slice(8)}}}

	==Collection==
	<collection>${id}</collection>`
	printHtml(text.replace(/</g, '&lt;'));
	print();
}

function effect(id) {
	var eff = Effect.get(id);
	var page = visitUrl("desc_effect.php?whicheffect=" + eff.descid);
	var desc = page.match("<blockquote>([^<]+)</blockquote>");
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
	image=${eff.image}|
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
