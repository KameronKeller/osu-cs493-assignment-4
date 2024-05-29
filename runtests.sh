#! /bin/zsh

curl -X POST -H "Content-Type: multipart/form-data" \
    -F "businessId=1" -F "caption=my caption" \
    -F "upload=@batmanshark.jpg" \
    http://localhost:8000/photos