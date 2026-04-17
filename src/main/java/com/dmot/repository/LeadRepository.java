package com.dmot.repository;

import com.dmot.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByDomain(String domain);
    Optional<Lead> findByFullNameAndDomain(String fullName, String domain);
}
