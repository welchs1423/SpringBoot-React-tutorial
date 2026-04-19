package com.react.tutorial.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class FileUploadService {

    private final String uploadDir = "uploads/";

    public String upload(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 없습니다.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("유효하지 않은 파일명입니다.");
        }

        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        String savedFilename = UUID.randomUUID() + extension;
        File dest = new File(directory.getAbsolutePath() + File.separator + savedFilename);
        file.transferTo(dest);

        return "/uploads/" + savedFilename;
    }
}
