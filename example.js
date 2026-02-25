// Author is unknown
let resizedImages = []; // Array to store Blobs

                                const input_file = document.getElementById('img_file');
                                input_file.addEventListener('change', () => {
                                    if (!input_file.files.length) return;

                                    // Convert FileList to Array and loop through each file
                                    Array.from(input_file.files).forEach(file => {
                                        resize_image_file(file, {height: 480, get_extra_data: true}).then(res => {
                                            const img = new Image();
                                            img.src = URL.createObjectURL(res.output.file);
                                            img.style.width = '100px';
                                            resizedImages.push(res.output.file);

                                            // const container = document.getElementById('image-upload');

                                             // Create a wrapper for the image and the delete button
                                             const wrapper = document.createElement('div');
                                             wrapper.className = 'image-item';
                                             wrapper.style.display = 'inline-block';
                                             wrapper.style.margin = '10px';

                                             wrapper.appendChild(img);

                                             const delBtn = document.createElement('button');
                                             delBtn.type = 'button';
                                             delBtn.className = 'del-btn btn-small red'; // Materialize classes
                                             delBtn.innerText = 'delete';

                                             // Click event for the delete button
                                             delBtn.addEventListener('click', () => {
                                                // 1. Remove from the UI
                                                wrapper.remove();

                                                // 2. Remove from the array
                                                const index = resizedImages.indexOf(blob);
                                                if (index > -1) {
                                                    resizedImages.splice(index, 1);
                                                }
                                             });

                                             wrapper.appendChild(delBtn);
                                             document.getElementById('image-upload').appendChild(wrapper);
                                        });
                                    });
                                });

                                const pubForm = document.getElementById('new-pub');
                                pubForm.addEventListener('submit', async (e) => {
                                    e.preventDefault(); // Stop standard form submission

                                    const submitBtn = document.getElementById('submit-btn');
                                    const loader = document.getElementById('loading-bar');

                                    // 1. Show loader and disable button to prevent double-clicks
                                    loader.style.display = 'block';
                                    submitBtn.classList.add('disabled');

                                    try {
                                        const formData = new FormData(pubForm); // Capture other text inputs
                                        formData.delete('image[]');
                                        // Append each resized image using the "image[]" key for backend arrays
                                        resizedImages.forEach((blob, index) => {
                                            formData.append('image[]', blob, "image_" + index + ".png");
                                        });

                                        // Send via Fetch API
                                        const response = await fetch('${baseLayout.getServerPath()}/np/index.htm', {
                                            method: 'POST',
                                            body: formData,
                                            headers: {
                                                'X-Requested-With': 'XMLHttpRequest' // Standard marker for AJAX
                                            },
                                            redirect: 'follow'
                                        });

                                        if (response.redirected) {
                                            window.location.href = response.url;
                                            return;
                                        }

                                        const result = await response.json();
                                        if (result.redirectUrl) {
                                            window.location.href = result.redirectUrl;
                                        } else {
                                            // Standard success logic
                                            console.log('Upload complete:', result);
                                        }
                                    } catch (error) {
                                        console.error("Upload Error:", error);
                                        alert("Upload failed. Please try again.");
                                    } finally {
                                        // 2. Hide loader and re-enable button if we didn't redirect
                                        loader.style.display = 'none';
                                        submitBtn.classList.remove('disabled');
                                    }
                                });
