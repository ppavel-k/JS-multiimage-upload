// Author is unknown
const resize_image_file = (image_file, options = {}) => new Promise((resolve, reject) => {

	try{
		if(options.quality === undefined) options.quality = 1;
		const img = new Image();
		img.src = URL.createObjectURL(image_file);
		img.onload = () => {
			let is_same_type = false;
			const
				file_name = options.name || image_file.name || 'propre_img.jpg',
				dot_pos = file_name.lastIndexOf('.'),
				type = options.type || (dot_pos !== -1 ? ('jpeg|png|webp|gif|jpg'.includes(file_name.substring(dot_pos + 1).toLowerCase()) && (is_same_type = true) ? file_name.substring(dot_pos + 1).toLowerCase() : null) : null) || 'jpeg';
			options.type = type === 'jpg' ? 'jpeg' : type;
			options.name = is_same_type ? file_name : file_name.substring(0, dot_pos === -1 ? file_name.length : dot_pos) + '.' + options.type;

			// TODO: Improve below
			if(!options.width && options.max_width && (img.naturalWidth >= img.naturalHeight || (!options.height && !options.max_height)) && img.naturalWidth > options.max_width) options.width = options.max_width;
			if(!options.height && options.max_height && (img.naturalHeight >= img.naturalWidth || (!options.width && !options.max_width)) && img.naturalHeight > options.max_height) options.height = options.max_height;
			const
				canvas = document.createElement('canvas'),
				ctx = canvas.getContext('2d'),
				width = options.width || (options.height ? img.naturalWidth/img.naturalHeight * options.height : 0) || img.naturalWidth,
				height = options.height || (options.width ? img.naturalHeight/img.naturalWidth * options.width : 0) || img.naturalHeight;
			canvas.setAttribute('width', width);
			canvas.setAttribute('height', height);
			ctx.drawImage(img, 0, 0, width, height);
			canvas.toBlob(blob => {
				const
					new_file = new File([blob], options.name, {type: 'image/' + options.type, lastModified: Date.now()}),
					extra_data = {input: {file: image_file, name: image_file.name, type: image_file.type, size: image_file.size, height: img.naturalHeight, width: img.naturalWidth}, output: {file: new_file, name: options.name, type: new_file.type, size: new_file.size, height: height, width: width}};
				resolve(extra_data || new_file);
			}, 'image/' + options.type, options.quality);
		};
	} catch(err) {
	    reject(err);
	}
});


window.addEventListener('load', () => {

	const initial_attribute = 'input[type=file][ugi-adapter]';

	const check = node => {
		if(node.data_uploading_image_resizer) return;
		node.data_uploading_image_resizer = true;
		const
			options = node.getAttribute('ugi-adapter').split(',').map(v => v.split(':').map((s, i) => i === 0 ? s.trim().toLowerCase() : s.trim())).reduce((acc, curr) => ({...acc, [curr[0]]: 'height|width|quality|max_height|max_width'.includes(curr[0]) ? parseFloat(curr[1]) : curr[1]}), {}),
			target = options.target ? document.getElementById(options.target) : node;
		if(!target) throw new Error('Target was not found.');
		/* if(options.callback){
			let callback;
			eval('options.callback = ' + options.callback + ';');
		} */
		try {
          options.callback = new Function('return ' + options.callback)();
        } catch (e) {
          console.error('Invalid callback function:', e);
        }
        // End of improvement
		target.addEventListener('change', async () => {
			if(!target.files.length) return;
			const
				dt = new DataTransfer(),
				extra_ls = [];
			await Promise.all([...target.files].map(file => resize_image_file(file, {...options, get_extra_data: true}).then(res => extra_ls.push(res) && dt.items.add(res.output.file))));
			node.files = dt.files;
			if(options.callback) options.callback(node, extra_ls);
		});
	};

	[...document.querySelectorAll(initial_attribute)].forEach(check);
	
	const mutation_observer = new MutationObserver(entries => entries.forEach(entry => [...entry.addedNodes].forEach(node => node.querySelectorAll && [].concat(node.matches && node.matches(initial_attribute) ? node : [], ...node.querySelectorAll(initial_attribute)).forEach(check))));
	mutation_observer.observe(document.body, {childList: true, subtree: true});
	
}, {passive: true});
