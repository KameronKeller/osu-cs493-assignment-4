#! /bin/sh

status() {
    printf "\n=====================================================\n"
    printf "%s\n" "$1"
    printf -- "-----------------------------------------------------\n"
}

# Uncomment this if running repeatedly to automatically empty test_downloads directory
# echo "=== EMPTYING test/test_downloads ==="
# rm -rf test/test_downloads/*

businessId=$(curl http://localhost:8000/businesses | jq -r ".businesses[0]._id")

status "POST /photos uploads a jpg photo"
jpgPhotoId=$(curl -X POST -H "Content-Type: multipart/form-data" \
    -F "businessId=$businessId" -F "caption=my caption" \
    -F "upload=@test/test_images/batmanshark.jpg" \
    http://localhost:8000/photos | tee /dev/fd/2 | jq -r ".id")

status "POST /photos uploads a png photo"
pngPhotoId=$(curl -X POST -H "Content-Type: multipart/form-data" \
    -F "businessId=$businessId" -F "caption=my caption" \
    -F "upload=@test/test_images/dragons.png" \
    http://localhost:8000/photos | tee /dev/fd/2 | jq -r ".id")

status "GET /photos/{id} returns a photo (jpg)"
curl http://localhost:8000/photos/$jpgPhotoId | jq

status "GET /media/photos/{filename} downloads a photo (jpg)"
curl http://localhost:8000/media/photos/$jpgPhotoId.jpg --output ./test/test_downloads/$jpgPhotoId.jpg

status "GET /photos/{id} returns a photo (png)"
curl http://localhost:8000/photos/$pngPhotoId | jq

status "GET /media/photos/{filename} downloads a photo (png)"
curl http://localhost:8000/media/photos/$pngPhotoId.png --output ./test/test_downloads/$pngPhotoId.png

status "GET /media/thumbs/{filename} downloads a thumbnail (png to jpg)"
curl http://localhost:8000/media/thumbs/$pngPhotoId.jpg --output ./test/test_downloads/thumb-$pngPhotoId.jpg

status "GET /media/thumbs/{filename} downloads a thumbnail (jpg)"
curl http://localhost:8000/media/thumbs/$jpgPhotoId.jpg --output ./test/test_downloads/thumb-$jpgPhotoId.jpg
