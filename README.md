# Image Downloader & Optimizer

A Claude AI project for Know How Flooring (22.11.2025) is saved for generating content.

1. Copy HTML that includes Title, Dimension, Image, and URL
2. Ask Claude to generate a data collection following this [CSV Template](https://docs.google.com/spreadsheets/d/19gRP2Xa6ajue2ouYLbHQ-YsJpLrc3nn8/edit?usp=drive_link&ouid=116033898506055325604&rtpof=true&sd=true)
    a. Check dimensions
3. Upload CSV to the custom app [**Image Downloader**](https://github.com/VarisVision/Image-download)
    a. Set prefix to `know-how-flooring-`
    b. Convert to WebP
    c. Verify the downloaded image name includes the product name
4. Upload images to WordPress
5. Create or check categories in WordPress
    a. Optional: Rename newly generated categories after step 6
6. In Claude, write: "Generate import CSV file" and add the data collection file from step 2
7. Review the results
