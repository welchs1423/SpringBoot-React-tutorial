package com.react.tutorial.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    // 파일을 저장할 디렉토리 경로
    private final String uploadDir = "uploads/";

    @PostMapping
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file){
        if(file.isEmpty()){
            return ResponseEntity.badRequest().body("파일이 없습니다.");
        }

        try {
            File directory = new File(uploadDir);
            if(!directory.exists()){
                directory.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            String savedFilename = UUID.randomUUID() + extension;

            File dest = new File(directory.getAbsolutePath() + File.separator + savedFilename);
            file.transferTo(dest);

            String imageUrl = "/uploads/" + savedFilename;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IOException e){
            return ResponseEntity.badRequest().body("파일 업로드 실패: " + e.getMessage());
        }
    }
}
